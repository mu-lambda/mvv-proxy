import { testing as harness } from "shared";

import * as icons from "./icons.ts";

const { suite, test, expect } = harness;

/** shape, colour and label, as one string to compare. */
function style(name: string, product: string, id?: string): string {
    const s = icons.iconStyle({ name, product, id });
    return `${s.shape} ${s.colour} ${s.label}`;
}

const tests = [
    test("renames icons MVV has under another name", () => {
        expect(icons.renamedIcon("920S6.svg")).toBe("92M06.svg");
        expect(icons.renamedIcon("920S1.svg")).toBe("92M01.svg");
        expect(icons.renamedIcon("20X30.svg")).toBe("03X30.svg");
        // Not renames: Innsbruck's S6, a bus that merely contains 920, and
        // a regional express bus (MVV only has the plain bus's icon).
        expect(icons.renamedIcon("92AS6.svg")).toBe(undefined);
        expect(icons.renamedIcon("19920.svg")).toBe(undefined);
        expect(icons.renamedIcon("20208.svg")).toBe(undefined);
    }),

    test("draws each class of missing icon as decided", () => {
        // SEV: purple outline, without "SEV" in the label.
        // In the shape of the line replaced: the S-Bahn's pill.
        expect(style("SEV S6", "Ersatzverkehr", "ddb:870S6:A:H:j26")).toBe(
            "pill #992168 S6",
        );
        expect(style("SEV RB65", "Ersatzverkehr", "ddb:87RB6:5:H:j26")).toBe(
            "outline #992168 RB65",
        );
        expect(style("U3", "SEV", "swm:35503:G:H:016")).toBe(
            "outline #992168 U3",
        );
        // Regional express buses: light green.
        expect(style("X208", "ExpressBus", "mvv:20208: :H:s26")).toBe(
            "filled #4d9380 X208",
        );
        // New MVG lines: tram as a black outline, bus in teal.
        expect(style("14", "Tram", "swm:02014:G:H:016")).toBe(
            "outline #000000 14",
        );
        expect(style("O7", "Bus", "swm:03407:G:H:016")).toBe(
            "filled #005262 O7",
        );
        // On-demand and town buses: teal.
        expect(style("5680", "FLEXlinie", "mvv:16568:0:H:s26")).toBe(
            "filled #005262 5680",
        );
        expect(style("8160", "AST", "lvg:02816:0:H:s26")).toBe(
            "filled #005262 8160",
        );
        // Outside MVV: grey, by operator, and an S-Bahn without an icon.
        expect(style("73", "Bus", "rva:01073: :H:s26")).toBe(
            "filled #646464 73",
        );
        expect(style("S6", "S-Bahn", "ddb:92AS6:T:H:j26")).toBe(
            "filled #646464 S6",
        );
        // No id: drawn as MVV's.
        expect(style("438", "RegionalBus")).toBe("filled #005262 438");
    }),

    test("bus 438's wrong icon is drawn instead", () => {
        const line = icons.overrides.get("12438.svg");
        expect(line?.name).toBe("438");
    }),

    test("labels keep MVV's size unless they don't fit", () => {
        const size = (name: string, product: string) =>
            icons.fontSize(icons.iconStyle({ name, product }));
        expect(size("14", "Tram")).toBe(425);
        expect(size("O7", "Bus")).toBe(425);
        // Four digits are 2.224em: 940 / 2.224.
        expect(size("5680", "FLEXlinie")).toBe(422);
        // An outline has less room: 840 / 2.556.
        expect(size("SEV RB65", "Ersatzverkehr")).toBe(328);
    }),

    test("draws MVV's template", () => {
        const filled = icons.drawIcon({ name: "X208", product: "ExpressBus" });
        expect(filled.includes('viewBox="0 0 1000 500"')).toBe(true);
        expect(
            filled.includes('<rect fill="#4d9380" width="1000" height="500"/>'),
        ).toBe(true);
        expect(filled.includes('fill="#ffffff">X208</text>')).toBe(true);

        const outline = icons.drawIcon({ name: "U3", product: "SEV" });
        expect(
            outline.includes(
                '<rect x="25" y="25" width="950" height="450" fill="none" stroke="#992168"',
            ),
        ).toBe(true);
        expect(outline.includes('fill="#992168">U3</text>')).toBe(true);

        const pill = icons.drawIcon({ name: "SEV S6", product: "SEV" });
        expect(pill.includes('rx="231.8" ry="194.4" fill="none"')).toBe(true);
        expect(pill.includes('fill="#992168">S6</text>')).toBe(true);
    }),

    test("escapes the label", () => {
        const svg = icons.drawIcon({ name: `<a href="x">&'`, product: "Bus" });
        expect(svg.includes("&lt;a href=&quot;x&quot;&gt;&amp;&apos;")).toBe(
            true,
        );
        expect(svg.includes("<a ")).toBe(false);
    }),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
