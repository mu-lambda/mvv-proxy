import { strings, testing as harness } from "shared";

import * as page from "./page.ts";

const { suite, test, expect } = harness;

const tests = [
    test("the browser's preference picks the language at /", () => {
        // What Express's acceptsLanguages("en", "de") returns.
        expect(strings.pickLang("de")).toBe("de");
        expect(strings.pickLang("en")).toBe("en");
        // Neither: English.
        expect(strings.pickLang(false)).toBe("en");
    }),

    test("the client reads the language back from <html lang>", () => {
        expect(strings.langOf("de")).toBe("de");
        expect(strings.langOf("de-AT")).toBe("de");
        expect(strings.langOf("en")).toBe("en");
        expect(strings.langOf("")).toBe("en");
    }),

    test("each language has its own text and address", () => {
        const de = page.nearbyPage("de", "de");
        expect(de.includes('<html lang="de">')).toBe(true);
        expect(de.includes("<title>Abfahrten in der Nähe – MVV</title>")).toBe(
            true,
        );
        expect(de.includes('og:locale" content="de_DE"')).toBe(true);
        expect(
            de.includes('rel="canonical" href="https://mvv.mulambda.de/de"'),
        ).toBe(true);

        const en = page.nearbyPage("en", "en");
        expect(en.includes('<html lang="en">')).toBe(true);
        expect(en.includes("<title>MVV Departures nearby</title>")).toBe(true);
        expect(
            en.includes('rel="canonical" href="https://mvv.mulambda.de/en"'),
        ).toBe(true);
    }),

    test("/ is its own address, whatever language it shows", () => {
        for (const lang of ["de", "en"] as const) {
            const html = page.nearbyPage(lang, "auto");
            expect(
                html.includes(
                    'rel="canonical" href="https://mvv.mulambda.de/"',
                ),
            ).toBe(true);
            expect(
                html.includes('og:url" content="https://mvv.mulambda.de/"'),
            ).toBe(true);
        }
    }),

    test("every version lists all three for search engines", () => {
        for (const html of [
            page.nearbyPage("de", "de"),
            page.nearbyPage("en", "en"),
            page.nearbyPage("en", "auto"),
        ]) {
            for (const link of [
                'hreflang="de" href="https://mvv.mulambda.de/de"',
                'hreflang="en" href="https://mvv.mulambda.de/en"',
                'hreflang="x-default" href="https://mvv.mulambda.de/"',
            ]) {
                expect(html.includes(link)).toBe(true);
            }
        }
    }),

    test("styles and script load from the root, also under /de/", () => {
        const html = page.nearbyPage("de", "de");
        expect(html.includes('href="/index.css"')).toBe(true);
        expect(html.includes('src="/out/index-bundle.js"')).toBe(true);
        expect(/(href|src)="(?!\/|https:)/.test(html)).toBe(false);
    }),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
