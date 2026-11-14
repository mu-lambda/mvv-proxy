import { strings, testing as harness } from "shared";

import * as page from "./page.ts";

const { suite, test, expect } = harness;

const HOST = "departures.example.org";

const tests = [
    test("the browser's preference picks the language at /", () => {
        // What Express's acceptsLanguages("en", "de") returns.
        expect(strings.pickLang("de")).toBe("de");
        expect(strings.pickLang("en")).toBe("en");
        expect(strings.pickLang("ru")).toBe("ru");
        // Neither: English.
        expect(strings.pickLang(false)).toBe("en");
    }),

    test("the client reads the language back from <html lang>", () => {
        expect(strings.langOf("de")).toBe("de");
        expect(strings.langOf("de-AT")).toBe("de");
        expect(strings.langOf("en")).toBe("en");
        expect(strings.langOf("ru")).toBe("ru");
        expect(strings.langOf("ru-RU")).toBe("ru");
        expect(strings.langOf("rux")).toBe("en");
        expect(strings.langOf("")).toBe("en");
    }),

    test("each language has its own text and address", () => {
        const de = page.nearbyPage("de", "de", HOST);
        expect(de.includes('<html lang="de">')).toBe(true);
        expect(de.includes("<title>Abfahrten in der Nähe – MVV</title>")).toBe(
            true,
        );
        expect(de.includes('og:locale" content="de_DE"')).toBe(true);
        expect(
            de.includes(`og:image" content="https://${HOST}/og-image-de.png"`),
        ).toBe(true);
        expect(de.includes(`rel="canonical" href="https://${HOST}/de"`)).toBe(
            true,
        );

        const en = page.nearbyPage("en", "en", HOST);
        expect(en.includes('<html lang="en">')).toBe(true);
        expect(en.includes("<title>MVV Departures nearby</title>")).toBe(true);
        expect(en.includes(`rel="canonical" href="https://${HOST}/en"`)).toBe(
            true,
        );

        const ru = page.nearbyPage("ru", "ru", HOST);
        expect(ru.includes('<html lang="ru">')).toBe(true);
        expect(ru.includes("<title>MVV: Что Где Куда</title>")).toBe(true);
        expect(ru.includes('og:locale" content="ru_RU"')).toBe(true);
        expect(
            ru.includes(`og:image" content="https://${HOST}/og-image-ru.png"`),
        ).toBe(true);
        expect(ru.includes(`rel="canonical" href="https://${HOST}/ru"`)).toBe(
            true,
        );
    }),

    test("/ is its own address, whatever language it shows", () => {
        for (const lang of strings.LANGS) {
            const html = page.nearbyPage(lang, "auto", HOST);
            expect(
                html.includes(`rel="canonical" href="https://${HOST}/"`),
            ).toBe(true);
            expect(html.includes(`og:url" content="https://${HOST}/"`)).toBe(
                true,
            );
        }
    }),

    test("every version lists them all for search engines", () => {
        for (const html of [
            page.nearbyPage("de", "de", HOST),
            page.nearbyPage("en", "en", HOST),
            page.nearbyPage("ru", "ru", HOST),
            page.nearbyPage("en", "auto", HOST),
        ]) {
            for (const link of [
                `hreflang="de" href="https://${HOST}/de"`,
                `hreflang="en" href="https://${HOST}/en"`,
                `hreflang="ru" href="https://${HOST}/ru"`,
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

    test("the script and styles are linked with their version", () => {
        const html = page.nearbyPage("en", "en", HOST, (p) => `${p}?v=1`);
        for (const tag of [
            '<link rel="stylesheet" href="/fonts/librefranklin/librefranklin.css?v=1" />',
            '<link rel="stylesheet" href="/index.css?v=1" />',
            '<link rel="stylesheet" href="/loading.css?v=1" />',
            '<link rel="stylesheet" href="/table.css?v=1" />',
            '<script src="/out/index-bundle.js?v=1"></script>',
            'data-impressum="/impressum?v=1"',
            'data-datenschutz="/datenschutz?v=1"',
        ]) {
            expect(html.includes(tag)).toBe(true);
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
        for (const lang of strings.LANGS) {
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
        expect(JSON.parse(page.manifest("ru")).short_name).toBe("Что Где Куда");
    }),

    test("Russian counts stops with the right ending", () => {
        const t = strings.forLang("ru");
        const ending = (n: number) => t.fetching(n).split(" ").pop();
        for (const n of [1, 21, 101]) expect(ending(n)).toBe("остановки");
        for (const n of [2, 4, 5, 11, 12, 14, 20, 25, 111]) {
            expect(ending(n)).toBe("остановок");
        }
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
