/**
 * The MVV area (Verbundraum): which districts it covers, and since when.
 *
 * stops.csv reaches well past it, into Traunstein, Altötting, Kelheim,
 * Augsburg and Austria, so being near a stop doesn't mean being in the area.
 * A stop's global ID names its district instead: "de:09162:1" is in
 * 09162, München. These are the districts' official keys (Kreisschlüssel).
 *
 * MVV grows: add districts as they join, with the day they do (`since`;
 * the founding members have none). muenchen.de lists the members ("Zum MVV
 * gehören …").
 */
const DISTRICTS: { key: string; name: string; since?: string }[] = [
    { key: "09162", name: "München" },
    { key: "09184", name: "Landkreis München" },
    { key: "09174", name: "Dachau" },
    { key: "09175", name: "Ebersberg" },
    { key: "09177", name: "Erding" },
    { key: "09178", name: "Freising" },
    { key: "09179", name: "Fürstenfeldbruck" },
    { key: "09188", name: "Starnberg" },
    { key: "09173", name: "Bad Tölz-Wolfratshausen", since: "2023-12-10" },
    { key: "09182", name: "Miesbach", since: "2023-12-10" },
    { key: "09187", name: "Landkreis Rosenheim", since: "2023-12-10" },
    { key: "09163", name: "Rosenheim", since: "2023-12-10" },
    { key: "09181", name: "Landsberg am Lech", since: "2025-01-01" },
    { key: "09190", name: "Weilheim-Schongau", since: "2025-01-01" },
    { key: "09180", name: "Garmisch-Partenkirchen", since: "2026-01-01" },
    { key: "09183", name: "Mühldorf a. Inn", since: "2026-01-01" },
    { key: "09274", name: "Landkreis Landshut", since: "2026-01-01" },
    { key: "09261", name: "Landshut", since: "2026-01-01" },
    { key: "09777", name: "Ostallgäu", since: "2027-01-01" },
    { key: "09762", name: "Kaufbeuren", since: "2027-01-01" },
];

/** The district key in a stop's global ID ("de:09162:1" → "09162"). */
function districtOf(gid: string): string | undefined {
    const m = /^de:(\d{5}):/.exec(gid);
    return m ? m[1] : undefined;
}

/** Whether the stop with global ID `gid` is in the MVV area on `date`. */
export function inMvvArea(gid: string, date: Date): boolean {
    const key = districtOf(gid);
    // The dates are German days; comparing them in UTC is off by at most
    // an hour or two around midnight of the day a district joins.
    const day = date.toISOString().slice(0, 10);
    return DISTRICTS.some(
        (d) => d.key === key && (d.since === undefined || d.since <= day),
    );
}
