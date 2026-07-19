// Generates numbered MVV bus-stop sign SVGs (Bussteig-1.svg .. Bussteig-20.svg): the
// yellow disk + green ring from Hst.svg with the central letter "H" replaced by
// a number. Digits are emitted as outlined <path>s (via Public Sans, the kiosk
// UI font) so each file is self-contained and font-independent at render time,
// matching www/U-Bahn.svg and the original H.
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
const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20
const GREEN = "#008754";
const CENTER = 441.67; // viewBox center (883.34 / 2)
const MAX_H = 457; // ≈ the original H's height in root px (height-limits 1 digit)
const MAX_W = 500; // keeps 2-digit numbers inside the green ring without clipping
const REF_SIZE = 1000; // font size used only to measure, then scaled to fit
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

function digitPath(font, text) {
    // Measure at REF_SIZE, then scale so the glyph fits MAX_W × MAX_H.
    const ref = font.getPath(text, 0, 0, REF_SIZE);
    const { w, h } = bboxSize(ref.getBoundingBox());
    const fontSize = REF_SIZE * Math.min(MAX_W / w, MAX_H / h);

    // Re-render at the fitted size and translate the bbox center onto CENTER.
    const p = font.getPath(text, 0, 0, fontSize);
    const bb = p.getBoundingBox();
    const dx = CENTER - (bb.x1 + bb.x2) / 2;
    const dy = CENTER - (bb.y1 + bb.y2) / 2;
    const d = p.toPathData(2);
    return `  <g transform="translate(${dx.toFixed(2)},${dy.toFixed(2)})"><path style="fill:${GREEN};fill-opacity:1;stroke:none" d="${d}" /></g>`;
}

function svgFor(font, n) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 883.34003 883.34003" width="883.34003" height="883.34003">
${ARTWORK}
${digitPath(font, String(n))}
</svg>
`;
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
        fs.writeFileSync(path.join(outDir, `Bussteig-${n}.svg`), svgFor(font, n));
    }
    console.log(
        `Wrote ${NUMBERS.length} signs (Bussteig-${NUMBERS[0]}.svg .. Bussteig-${NUMBERS[NUMBERS.length - 1]}.svg) to ${outDir}`,
    );
}

main();
