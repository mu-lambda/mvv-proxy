/**
 * Line icons MVV doesn't have: names it has them under instead, and icons
 * drawn in MVV's own template. MVV-ICONS.md has the survey and decisions.
 */

/** What an icon is drawn from: the line as a departure describes it. */
export type LineForIcon = {
    /** The line's name, e.g. "X208", "SEV S6", "U3". */
    name: string;
    /** MVV's product, e.g. "ExpressBus", "SEV", "Tram". */
    product: string;
    /** MVV's line id, e.g. "mvv:20208: :H:s26"; its first part is the operator. */
    id?: string | undefined;
};

/** The purple of the Ersatzverkehr sign. */
export const SEV_COLOUR = "#992168";
const BUS_COLOUR = "#005262";
const EXPRESS_BUS_COLOUR = "#4d9380";
const OUTSIDE_MVV_COLOUR = "#646464";
const TRAM_COLOUR = "#000000";
const TEXT_ON_FILL = "#ffffff";

/** Operators in MVV (the first part of a line id). Others are drawn grey. */
const MVV_OPERATORS = new Set(["ddb", "swm", "mvv", "lvg"]);

/** Icons MVV has but gets wrong, and the line to draw instead. */
export const overrides: ReadonlyMap<string, LineForIcon> = new Map([
    // Bus 438's icon reads "9441".
    ["12438.svg", { name: "438", product: "RegionalBus" }],
]);

/** The name MVV has an icon under, for icons it lacks under their own. */
export function renamedIcon(filename: string): string | undefined {
    // S-Bahn under its new line code: 920S6.svg is MVV's 92M06.svg.
    let m = /^920S(\d)\.svg$/.exec(filename);
    if (m) {
        return `92M0${m[1]}.svg`;
    }
    // MVG express buses: 20X30.svg is MVV's 03X30.svg.
    m = /^20X(\w+)\.svg$/.exec(filename);
    if (m) {
        return `03X${m[1]}.svg`;
    }
    return undefined;
}

export type IconStyle = {
    /**
     * A filled rectangle with white text; an outlined rectangle in one
     * colour; or an outlined pill, the S-Bahn's shape.
     */
    shape: "filled" | "outline" | "pill";
    colour: string;
    label: string;
};

export function iconStyle(line: LineForIcon): IconStyle {
    const operator = line.id?.split(":")[0];
    if (line.product === "SEV" || line.product === "Ersatzverkehr") {
        // DB names its replacement services "SEV S6"; the outline says SEV.
        const label = line.name.replace(/^SEV\s+/, "");
        // The replaced line's shape: of MVV's icons, only the S-Bahn's
        // differs from a rectangle.
        const shape = /^S\d+$/.test(label) ? "pill" : "outline";
        return { shape, colour: SEV_COLOUR, label };
    }
    // Munich's S-Bahn icons all exist (renamedIcon), so an S-Bahn without one
    // is elsewhere, like Innsbruck's S6 (ddb:92AS6).
    const outsideMvv =
        (operator !== undefined && !MVV_OPERATORS.has(operator)) ||
        line.product === "S-Bahn";
    if (outsideMvv) {
        return {
            shape: "filled",
            colour: OUTSIDE_MVV_COLOUR,
            label: line.name,
        };
    }
    if (line.product === "ExpressBus") {
        return {
            shape: "filled",
            colour: EXPRESS_BUS_COLOUR,
            label: line.name,
        };
    }
    if (line.product === "Tram") {
        // Like MVV's tram 28.
        return { shape: "outline", colour: TRAM_COLOUR, label: line.name };
    }
    return { shape: "filled", colour: BUS_COLOUR, label: line.name };
}

// Arial Bold advance widths in em, to size a label to fit.
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const UPPER_WIDTHS = [
    0.722, 0.722, 0.722, 0.722, 0.667, 0.611, 0.778, 0.722, 0.278, 0.556, 0.722,
    0.611, 0.833, 0.722, 0.778, 0.667, 0.778, 0.722, 0.667, 0.611, 0.722, 0.667,
    0.944, 0.667, 0.667, 0.611,
];
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const LOWER_WIDTHS = [
    0.556, 0.611, 0.556, 0.611, 0.556, 0.333, 0.611, 0.611, 0.278, 0.278, 0.556,
    0.278, 0.889, 0.611, 0.611, 0.611, 0.611, 0.389, 0.556, 0.333, 0.611, 0.556,
    0.778, 0.556, 0.556, 0.5,
];
const WIDTHS = new Map<string, number>([
    ...[...UPPER].map((c, i): [string, number] => [c, UPPER_WIDTHS[i]!]),
    ...[...LOWER].map((c, i): [string, number] => [c, LOWER_WIDTHS[i]!]),
    ...[..."0123456789"].map((c): [string, number] => [c, 0.556]),
    [" ", 0.278],
    ["-", 0.333],
    ["/", 0.278],
    [".", 0.278],
]);

/** The label's width in em, in Arial Bold. */
export function labelWidth(text: string): number {
    let w = 0;
    for (const c of text) {
        w += WIDTHS.get(c) ?? 0.722;
    }
    return w;
}

/** MVV's font size, kept whenever the label fits. */
const MVV_FONT_SIZE = 425;
/** Room for the label: inside a filled icon, and inside an outline's frame. */
const ROOM = { filled: 940, outline: 840, pill: 700 };

/** The font size that fits the label in the icon, at most MVV's. */
export function fontSize(style: IconStyle): number {
    const width = labelWidth(style.label);
    if (width === 0) {
        return MVV_FONT_SIZE;
    }
    return Math.min(MVV_FONT_SIZE, Math.floor(ROOM[style.shape] / width));
}

function escapeXml(s: string): string {
    return s.replace(
        /[&<>"']/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&apos;",
            })[c]!,
    );
}

/** An icon for the line in MVV's template: 1000×500, bold Arial label. */
export function drawIcon(line: LineForIcon): string {
    const style = iconStyle(line);
    // Outlines are 50 wide and drawn inset by 25, so their outer edge is
    // where MVV's shapes end. No fill, so the row colour shows through.
    const outline = `fill="none" stroke="${style.colour}" stroke-width="50"`;
    const shape = {
        filled: `<rect fill="${style.colour}" width="1000" height="500"/>`,
        // MVV's tram 28 frame.
        outline: `<rect x="25" y="25" width="950" height="450" ${outline}/>`,
        // MVV's S-Bahn pill spans y 30.6 to 469.4, with elliptical ends
        // 256.8 wide and 219.4 high.
        pill:
            `<rect x="25" y="55.6" width="950" height="388.8" ` +
            `rx="231.8" ry="194.4" ${outline}/>`,
    }[style.shape];
    const textColour = style.shape === "filled" ? TEXT_ON_FILL : style.colour;
    const text =
        `<text text-anchor="middle" x="50%" y="50%" dy=".35em" ` +
        `font-family="Arial, sans-serif" font-weight="bold" ` +
        `font-size="${fontSize(style)}px" fill="${textColour}">` +
        `${escapeXml(style.label)}</text>`;
    return (
        `<?xml version="1.0" encoding="utf-8"?>\n` +
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500">\n` +
        `${shape}\n${text}\n</svg>\n`
    );
}
