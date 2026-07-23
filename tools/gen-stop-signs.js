// Generates numbered departure-point sign SVGs for the kiosk:
//   Bussteig-N.svg    — the yellow disk + green ring from Hst.svg with the
//                       central letter "H" replaced by a green number (Steig).
//   Gleis-N.svg       — a dark blue rounded rectangle with a white number (Gleis).
//   UBahnGleis-N.svg  — a dark blue circle with a white number (UBahnGleis).
// All share the same 883x883 canvas so they render at the same size. Digits are
// emitted as outlined <path>s (via Public Sans, the kiosk UI font) so each file
// is self-contained and font-independent at render time.
//
// Invoked as a build action by //www:stop_signs (see www/BUILD.bazel), which
// passes --font and --out-dir. Also runnable by hand from the repo root:
//   node tools/gen-stop-signs.js                 (writes into www/)
//   node tools/gen-stop-signs.js --out-dir /tmp  (writes elsewhere)

const fs = require("node:fs");
const path = require("node:path");
const opentype = require("opentype.js");

const REPO_ROOT = path.resolve(__dirname, "..");

// --- Tunables ---------------------------------------------------------------
// Public Sans ExtraBold (weight 800) — closest to the heavy stroke of the
// original "H". Swap for 700 (…u8Z65ww) or 900 (…uv565ww) from publicsans.css.
const DEFAULT_FONT = path.join(
    REPO_ROOT,
    "fonts/publicsans/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymulp65ww.ttf",
);
const DEFAULT_OUT_DIR = path.join(REPO_ROOT, "www");
const NUMBERS = Array.from({ length: 40 }, (_, i) => i + 1); // 1..40
const CANVAS = 883.34003; // shared viewBox for both sign kinds
const CENTER = CANVAS / 2; // 441.67
const REF_SIZE = 1000; // font size used only to measure, then scaled to fit

// Steig (Bussteig): green number on the yellow disk + green ring.
const YELLOW = "#f0c900";
const GREEN = "#158829";
const RING_OUTER_R = 420; // outer edge of the green ring
const RING_INNER_R = 350; // inner edge — the yellow disk shows through here
// Grown with the ring's hole: these are the original 457/500 (sized for an
// inner radius of 309.79) scaled by the ratio of the new RING_INNER_R, so the
// digits keep the same margin inside the yellow area as before.
const STEIG_MAX_H = 516; // height-limits 1 digit
const STEIG_MAX_W = 565; // keeps 2-digit numbers inside the green ring

// Gleis: white number on a dark blue rounded rectangle.
const BLUE = "#002d72";
const GLEIS_RADIUS = 110; // corner radius of the blue rectangle
const GLEIS_MAX_H = 600; // taller than Steig — the rectangle has more room
const GLEIS_MAX_W = 640;

// UBahnGleis: white number on a dark blue circle (same blue as Gleis). Smaller
// max than Gleis so 2-digit numbers stay inside the circle without clipping.
const UBAHN_MAX_H = 520;
const UBAHN_MAX_W = 560;
// ----------------------------------------------------------------------------

// Artwork from Hst.svg (the H path is dropped): yellow disk + green ring. The
// original was a pair of Bézier paths inside a Y-flipping group
// (matrix(1.25,0,0,-1.25,0,883.34)); both are exact circles about the canvas
// centre, so they are written here as plain <circle>s in the unflipped canvas:
// the yellow disk fills the viewBox, and the ring is a green disk with a
// yellow one punched back out of it (as in the original, the ring's inside is
// just the yellow disk showing through). The two ring radii are the original's
// 336.33 and 247.83, scaled by the 1.25 the flipping group applied.
const ARTWORK = `  <circle cx="${CENTER}" cy="${CENTER}" r="${CENTER}" style="fill:${YELLOW};stroke:none" />
  <circle cx="${CENTER}" cy="${CENTER}" r="${RING_OUTER_R}" style="fill:${GREEN};stroke:none" />
  <circle cx="${CENTER}" cy="${CENTER}" r="${RING_INNER_R}" style="fill:${YELLOW};stroke:none" />`;

function bboxSize(bb) {
    return { w: bb.x2 - bb.x1, h: bb.y2 - bb.y1 };
}

function digitPath(font, text, fill, maxW, maxH) {
    // Measure at REF_SIZE, then scale so the glyph fits maxW × maxH. Round to an
    // integer font size: opentype.js's path generation emits NaN coordinates at
    // some pathological fractional sizes (e.g. "3" at ~806.45), and integer
    // sizes avoid it (the sub-pixel difference is negligible on a 1000 em).
    const ref = font.getPath(text, 0, 0, REF_SIZE);
    const { w, h } = bboxSize(ref.getBoundingBox());
    const fontSize = Math.floor(REF_SIZE * Math.min(maxW / w, maxH / h));

    // Re-render at the fitted size and translate the bbox center onto CENTER.
    const p = font.getPath(text, 0, 0, fontSize);
    const bb = p.getBoundingBox();
    const dx = CENTER - (bb.x1 + bb.x2) / 2;
    const dy = CENTER - (bb.y1 + bb.y2) / 2;
    const d = p.toPathData(2);
    if (d.includes("NaN")) {
        throw new Error(`Path for "${text}" at size ${fontSize} contains NaN`);
    }
    return `  <g transform="translate(${dx.toFixed(2)},${dy.toFixed(2)})"><path style="fill:${fill};fill-opacity:1;stroke:none" d="${d}" /></g>`;
}

function svg(body) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">
${body}
</svg>
`;
}

/** Bussteig (Steig): green number on the yellow disk + green ring. */
function steigSvgFor(font, n) {
    const digit = digitPath(font, String(n), GREEN, STEIG_MAX_W, STEIG_MAX_H);
    return svg(`${ARTWORK}\n${digit}`);
}

/** Gleis: white number on a dark blue rounded rectangle. */
function gleisSvgFor(font, n) {
    const rect = `  <rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" rx="${GLEIS_RADIUS}" ry="${GLEIS_RADIUS}" style="fill:${BLUE};stroke:none" />`;
    const digit = digitPath(font, String(n), "#ffffff", GLEIS_MAX_W, GLEIS_MAX_H);
    return svg(`${rect}\n${digit}`);
}

/** UBahnGleis: white number on a dark blue circle. */
function ubahnGleisSvgFor(font, n) {
    const circle = `  <circle cx="${CENTER}" cy="${CENTER}" r="${CENTER}" style="fill:${BLUE};stroke:none" />`;
    const digit = digitPath(font, String(n), "#ffffff", UBAHN_MAX_W, UBAHN_MAX_H);
    return svg(`${circle}\n${digit}`);
}

function parseArgs(argv) {
    let font = DEFAULT_FONT;
    let outDir = DEFAULT_OUT_DIR;
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--font") font = argv[++i];
        else if (argv[i] === "--out-dir") outDir = argv[++i];
        else throw new Error(`Unexpected argument: ${argv[i]}`);
    }
    if (font === undefined || outDir === undefined) {
        throw new Error("Usage: gen-stop-signs.js [--font <ttf>] [--out-dir <dir>]");
    }
    return { font, outDir };
}

// Under a Bazel action the tool runs with cwd = BAZEL_BINDIR, while the
// --font / --out-dir args ($(execpath)/$(RULEDIR)) are execroot-relative. Chdir
// to the execroot so those relative paths resolve. (No-op outside Bazel.)
function chdirToExecrootUnderBazel() {
    const bindir = process.env.BAZEL_BINDIR;
    const cwd = process.cwd();
    if (bindir && cwd.endsWith(path.sep + bindir)) {
        process.chdir(cwd.slice(0, -(bindir.length + 1)));
    }
}

function main() {
    chdirToExecrootUnderBazel();
    const { font: fontPath, outDir } = parseArgs(process.argv.slice(2));
    const font = opentype.parse(fs.readFileSync(fontPath).buffer);
    fs.mkdirSync(outDir, { recursive: true });
    for (const n of NUMBERS) {
        fs.writeFileSync(
            path.join(outDir, `Bussteig-${n}.svg`),
            steigSvgFor(font, n),
        );
        fs.writeFileSync(
            path.join(outDir, `Gleis-${n}.svg`),
            gleisSvgFor(font, n),
        );
        fs.writeFileSync(
            path.join(outDir, `UBahnGleis-${n}.svg`),
            ubahnGleisSvgFor(font, n),
        );
    }
    const last = NUMBERS[NUMBERS.length - 1];
    console.log(
        `Wrote ${NUMBERS.length * 3} signs (Bussteig-/Gleis-/UBahnGleis-${NUMBERS[0]}..${last}.svg) to ${outDir}`,
    );
}

main();
