#!/bin/bash
# Replaces server/data/stops.csv with MVV's current stop list, the
# "MVV Haltestellenliste (CSV, <date>)" on MVV's page for developers.
# MVV updates it about once a year, under a new file name, so the script
# finds the link on the page rather than knowing it.
#
# It checks the download against the checksum on the page and against the
# columns the server reads, and records where and when the list came from
# in server/src/stopsSource.ts: the licence (CC BY) asks for both, and the
# Impressum shows them. Run ./pre-commit.sh afterwards.
set -euo pipefail
cd "$(dirname "$0")"

PAGE=https://www.mvv-muenchen.de/service-hilfe/mvv-content-fuer-entwickler/
SITE=https://www.mvv-muenchen.de
UA="mvv-proxy update-stops.sh (+https://github.com/mu-lambda/mvv-proxy)"
STOPS=server/data/stops.csv
SOURCE=server/src/stopsSource.ts
# The columns server/src/data.ts reads.
HEADER="HstNummer;Name ohne Ort;Ort;Globale ID;WGS84 X;WGS84 Y"

fail() {
    echo "update-stops.sh: $*" >&2
    exit 1
}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

curl -fsS -A "$UA" "$PAGE" -o "$tmp/page.html"

# The page as one line, from the stop list's link on:
# <a class="download-link" href="…/MVV_Haltestellen_Report_s26.csv"> …
# "MVV Haltestellenliste (CSV, 07.01.2026)" … "md5-Prüfziffer: <40 hex>".
entry=$(tr -s '\r\n\t ' ' ' <"$tmp/page.html" |
    sed -nE 's/.*(href="[^"]*Haltestellen_Report[^"]*\.csv")/\1/p' |
    cut -c1-1500)
[[ -n $entry ]] || fail "no link to the stop list on $PAGE"
path=$(grep -oE 'href="[^"]*"' <<<"$entry" | sed -n 1p | sed -E 's/^href="|"$//g')
title=$(grep -oE 'Haltestellenliste \(CSV, [0-9.]+\)' <<<"$entry" | sed -n 1p) ||
    fail "no title (\"Haltestellenliste (CSV, <date>)\") for $path"
stand=$(grep -oE '[0-9]{2}\.[0-9]{2}\.[0-9]{4}' <<<"$title")
# The page calls it md5, but it is 40 hex digits: a SHA-1.
# The first one: the next download's entry may follow within the cut.
checksum=$(grep -oE 'Prüfziffer: *[0-9a-f]{40}' <<<"$entry" |
    sed -n 1p | grep -oE '[0-9a-f]{40}') || fail "no checksum for $path"
case "$path" in
http*) url=$path ;;
/*) url=$SITE$path ;;
*) fail "unexpected link $path" ;;
esac

curl -fsS -A "$UA" "$url" -o "$tmp/stops.csv"

actual=$(shasum -a 1 "$tmp/stops.csv" | cut -d' ' -f1)
[[ $actual == "$checksum" ]] ||
    fail "$url has SHA-1 $actual, the page says $checksum"
first=$(head -1 "$tmp/stops.csv" | tr -d '\r')
[[ $first == "$HEADER" ]] ||
    fail "$url starts with \"$first\", not \"$HEADER\""

if cmp -s "$tmp/stops.csv" "$STOPS"; then
    echo "$STOPS is already MVV's current list (Stand $stand)."
    exit 0
fi

old=$(($(wc -l <"$STOPS") - 1))
new=$(($(wc -l <"$tmp/stops.csv") - 1))
cp "$tmp/stops.csv" "$STOPS"

# 07.01.2026 → 2026-01-07
stand_iso=$(sed -E 's/([0-9]{2})\.([0-9]{2})\.([0-9]{4})/\3-\2-\1/' <<<"$stand")
cat >"$SOURCE" <<EOF
// Written by update-stops.sh: where server/data/stops.csv comes from. MVV's
// stop list is CC BY, crediting MVV and the date of the download; the
// Impressum shows both (legal.ts).
export const STOPS_SOURCE = {
    /** The list's date ("Stand"), as MVV gives it. */
    stand: "$stand_iso",
    downloaded: "$(date +%Y-%m-%d)",
    url: "$url",
    page: "$PAGE",
    sha1: "$checksum",
};
EOF

echo "Updated $STOPS to Stand $stand: $old stops before, $new now."
echo "Run ./pre-commit.sh, and check the nearby page at a few stops."
