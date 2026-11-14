import { strings, testing as harness } from "shared";

import * as page from "./page.ts";

const { suite, test, expect } = harness;

const HOST = "departures.example.org";

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
        const de = page.nearbyPage("de", "de", HOST);
        expect(de.includes('<html lang="de">')).toBe(true);
        expect(de.includes("<title>Abfahrten in der Nähe – MVV</title>")).toBe(
            true,
        );
        expect(de.includes('og:locale" content="de_DE"')).toBe(true);
        expect(de.includes(`rel="canonical" href="https://${HOST}/de"`)).toBe(
            true,
        );

        const en = page.nearbyPage("en", "en", HOST);
        expect(en.includes('<html lang="en">')).toBe(true);
        expect(en.includes("<title>MVV Departures nearby</title>")).toBe(true);
        expect(en.includes(`rel="canonical" href="https://${HOST}/en"`)).toBe(
            true,
        );
    }),

    test("/ is its own address, whatever language it shows", () => {
        for (const lang of ["de", "en"] as const) {
            const html = page.nearbyPage(lang, "auto", HOST);
            expect(
                html.includes(`rel="canonical" href="https://${HOST}/"`),
            ).toBe(true);
            expect(html.includes(`og:url" content="https://${HOST}/"`)).toBe(
                true,
            );
        }
    }),

    test("every version lists all three for search engines", () => {
        for (const html of [
            page.nearbyPage("de", "de", HOST),
            page.nearbyPage("en", "en", HOST),
            page.nearbyPage("en", "auto", HOST),
        ]) {
            for (const link of [
                `hreflang="de" href="https://${HOST}/de"`,
                `hreflang="en" href="https://${HOST}/en"`,
                `hreflang="x-default" href="https://${HOST}/"`,
            ]) {
                expect(html.includes(link)).toBe(true);
            }
        }
    }),

    test("without a host, nothing links to an address", () => {
        for (const at of ["de", "auto"] as const) {
            const html = page.nearbyPage("de", at, undefined);
            expect(html.includes("canonical")).toBe(false);
            expect(html.includes("hreflang")).toBe(false);
            expect(html.includes("og:")).toBe(false);
            expect(html.includes("https:")).toBe(false);
            expect(html.includes('<link rel="manifest"')).toBe(true);
        }
    }),

    test("each language links its own manifest", () => {
        const de = page.nearbyPage("de", "auto", HOST);
        expect(
            de.includes('<link rel="manifest" href="/de.webmanifest" />'),
        ).toBe(true);
        expect(
            de.includes('apple-mobile-web-app-title" content="Abfahrten"'),
        ).toBe(true);
        const en = page.nearbyPage("en", "en", HOST);
        expect(
            en.includes('<link rel="manifest" href="/en.webmanifest" />'),
        ).toBe(true);
    }),

    test("a manifest has what browsers need to install the site", () => {
        for (const lang of ["de", "en"] as const) {
            const m = JSON.parse(page.manifest(lang));
            expect(m.lang).toBe(lang);
            expect(m.start_url).toBe(`/${lang}`);
            expect(m.display).toBe("standalone");
            expect(typeof m.name).toBe("string");
            expect(typeof m.short_name).toBe("string");
            const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
            expect(sizes.includes("192x192")).toBe(true);
            expect(sizes.includes("512x512")).toBe(true);
            expect(
                m.icons.some(
                    (i: { purpose?: string }) => i.purpose === "maskable",
                ),
            ).toBe(true);
        }
        expect(JSON.parse(page.manifest("de")).short_name).toBe("Abfahrten");
        expect(JSON.parse(page.manifest("en")).short_name).toBe("Departures");
    }),

    test("styles and script load from the root, also under /de/", () => {
        const html = page.nearbyPage("de", "de", HOST);
        expect(html.includes('href="/index.css"')).toBe(true);
        expect(html.includes('src="/out/index-bundle.js"')).toBe(true);
        expect(/(href|src)="(?!\/|https:)/.test(html)).toBe(false);
    }),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
