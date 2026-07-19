// Generates numbered departure-point sign SVGs for the kiosk:
//   Bussteig-1.svg .. Bussteig-20.svg  — the yellow disk + green ring from
//       Hst.svg with the central letter "H" replaced by a green number (Steig).
//   Gleis-1.svg .. Gleis-20.svg        — a dark blue rounded rectangle with a
//       white number (Gleis).
// Both share the same 883x883 canvas so they render at the same size. Digits are
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
const GREEN = "#008754";
const STEIG_MAX_H = 457; // ≈ the original H's height (height-limits 1 digit)
const STEIG_MAX_W = 500; // keeps 2-digit numbers inside the green ring

// Gleis: white number on a dark blue rounded rectangle.
const BLUE = "#002d72";
const GLEIS_RADIUS = 110; // corner radius of the blue rectangle
const GLEIS_MAX_H = 600; // taller than Steig — the rectangle has more room
const GLEIS_MAX_W = 640;
// ----------------------------------------------------------------------------

// Kept artwork from Hst.svg, verbatim: yellow disk + green ring. Lives inside
// the Y-flipping group (matrix(1.25,0,0,-1.25,0,883.34)); the H path is dropped.
const ARTWORK = `  <g transform="matrix(1.25,0,0,-1.25,0,883.34)">
    <path style="fill:#f0c900;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,353.324 c 0,194.84 158.508,353.348 353.348,353.348 194.836,0 353.324,-158.508 353.324,-353.348 C 706.672,158.508 548.184,0 353.348,0 158.508,0 0,158.508 0,353.324" />
    <path style="fill:${GREEN};fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 353.344,689.66 c -185.746,0 -336.332,-150.566 -336.332,-336.332 0,-185.75 150.586,-336.336 336.332,-336.336 185.75,0 336.336,150.586 336.336,336.336 0,185.766 -150.586,336.332 -336.336,336.332 z m 0,-88.504 c 136.883,0 247.832,-110.949 247.832,-247.828 0,-136.863 -110.949,-247.812 -247.832,-247.812 -136.86,0 -247.828,110.949 -247.828,247.812 0,136.879 110.968,247.828 247.828,247.828 z" />
  </g>`;

function bboxSize(bb) {
    return { w: bb.x2 - bb.x1, h: bb.y2 - bb.y1 };
}

function digitPath(font, text, fill, maxW, maxH) {
    // Measure at REF_SIZE, then scale so the glyph fits maxW × maxH.
    const ref = font.getPath(text, 0, 0, REF_SIZE);
    const { w, h } = bboxSize(ref.getBoundingBox());
    const fontSize = REF_SIZE * Math.min(maxW / w, maxH / h);

    // Re-render at the fitted size and translate the bbox center onto CENTER.
    const p = font.getPath(text, 0, 0, fontSize);
    const bb = p.getBoundingBox();
    const dx = CENTER - (bb.x1 + bb.x2) / 2;
    const dy = CENTER - (bb.y1 + bb.y2) / 2;
    const d = p.toPathData(2);
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
    }
    const last = NUMBERS[NUMBERS.length - 1];
    console.log(
        `Wrote ${NUMBERS.length * 2} signs (Bussteig-/Gleis-${NUMBERS[0]}..${last}.svg) to ${outDir}`,
    );
}

main();
