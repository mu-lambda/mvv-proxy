import { testing as harness } from "shared";

import { inMvvArea } from "./area.ts";

const { suite, test, expect } = harness;

const NOW = new Date("2026-11-14T12:00:00Z");

const tests = [
    test("München and the founding districts are in", () => {
        expect(inMvvArea("de:09162:1", NOW)).toBe(true);
        expect(inMvvArea("de:09178:4000", NOW)).toBe(true);
    }),

    test("districts that joined since are in", () => {
        // Rosenheim, Landshut.
        expect(inMvvArea("de:09163:1", NOW)).toBe(true);
        expect(inMvvArea("de:09261:1", NOW)).toBe(true);
    }),

    test("a district is in from the day it joins", () => {
        // Garmisch-Partenkirchen joined on 1 January 2026.
        const before = new Date("2025-12-31T12:00:00Z");
        const after = new Date("2026-01-01T12:00:00Z");
        expect(inMvvArea("de:09180:1", before)).toBe(false);
        expect(inMvvArea("de:09180:1", after)).toBe(true);
        // Ostallgäu joins on 1 January 2027.
        expect(inMvvArea("de:09777:1", NOW)).toBe(false);
        expect(inMvvArea("de:09777:1", new Date("2027-01-02"))).toBe(true);
    }),

    test("stops beyond MVV are out", () => {
        // Traunstein, Augsburg, Austria.
        expect(inMvvArea("de:09189:1", NOW)).toBe(false);
        expect(inMvvArea("de:09761:1", NOW)).toBe(false);
        expect(inMvvArea("at:47:1", NOW)).toBe(false);
        expect(inMvvArea("not a gid", NOW)).toBe(false);
    }),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
