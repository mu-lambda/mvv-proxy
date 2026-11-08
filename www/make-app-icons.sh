#!/bin/bash
# Makes the app icons (Add to Home Screen) from app-icon.svg. Needs
# ImageMagick. Run it after changing app-icon.svg, and commit the PNGs.
set -euo pipefail
cd "$(dirname "$0")"

# The drawing at `inner` pixels, centred on a white square of `size`.
icon() {
    local size=$1 inner=$2 out=$3
    magick -size "${size}x${size}" xc:white \
        \( -background none -density 600 app-icon.svg -resize "${inner}x${inner}" \) \
        -gravity center -composite -strip -colors 64 "PNG8:$out"
}

icon 512 512 icon-512.png
icon 192 192 icon-192.png
# Android may crop a maskable icon to a circle, and only the middle 80% is
# sure to show, so the badge in the corner has to move in.
icon 512 340 icon-maskable-512.png
# iOS rounds the corners, which would just touch the badge.
icon 180 164 apple-touch-icon.png
