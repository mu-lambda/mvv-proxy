import * as fs from "node:fs";
import { testing as harness } from "shared";

import * as legal from "./legal.ts";
import { STOPS_SOURCE } from "./stopsSource.ts";

const { suite, test, expect } = harness;

const EXAMPLE = fs.readFileSync("data/operator.example.yaml", "utf-8");
const HOST = "mvv.example.org";

function operator(): legal.Operator {
    const o = legal.parseOperator(EXAMPLE);
    if (Array.isArray(o)) {
        throw new Error(o.join("; "));
    }
    return o;
}

const tests = [
    test("the example operator file is valid", () => {
        const o = operator();
        expect(o.name).toBe("Erika Mustermann");
        expect(o.address.join(" / ")).toBe(
            "Musterstraße 1 / 12345 Musterstadt",
        );
        expect(o.email).toBe("kontakt@example.org");
        expect(o.host).toBe(HOST);
    }),

    test("a broken operator file says what is wrong", () => {
        const errors = legal.parseOperator(
            "name: ''\naddress: Musterstraße 1\nemail: nobody\n",
        );
        expect(Array.isArray(errors)).toBe(true);
        expect((errors as string[]).join("; ")).toBe(
            "name: expected text; hosting: expected text; " +
                "host: expected text; email: not an address; " +
                "address: expected a list of lines",
        );
        for (const host of [
            "https://mvv.example.org",
            "mvv.example.org/",
            "mvv.example.org:3000",
            "MVV.example.org",
            "-mvv.example.org",
            "mvv..example.org",
            'mvv.example.org"><script>',
        ]) {
            const text = EXAMPLE.replace(/^host: .*$/m, `host: '${host}'`);
            const errors = legal.parseOperator(text);
            expect(Array.isArray(errors) ? errors.join("; ") : "").toBe(
                "host: expected a host name such as mvv.example.org",
            );
        }
        expect(Array.isArray(legal.parseOperator("just text"))).toBe(true);
        expect(Array.isArray(legal.parseOperator("a: [unclosed"))).toBe(true);
    }),

    test("the Impressum credits MVV for the stops, with the dates", () => {
        const html = legal.impressumPage(operator());
        const { stand, downloaded } = STOPS_SOURCE;
        const german = (iso: string) => iso.split("-").reverse().join(".");
        expect(
            html.includes(
                `Stand ${german(stand)}, abgerufen am\n${german(downloaded)},`,
            ),
        ).toBe(true);
        expect(
            html.includes(`as of ${stand},\ndownloaded on ${downloaded},`),
        ).toBe(true);
        expect(
            html.includes(
                '<a href="https://opendefinition.org/licenses/cc-by/">',
            ),
        ).toBe(true);
    }),

    test("the Impressum shows the operator, in German and English", () => {
        const html = legal.impressumPage(operator());
        expect(html.includes('<html lang="de">')).toBe(true);
        expect(html.includes("Angaben gemäß § 5 DDG")).toBe(true);
        expect(html.includes('<div lang="en">')).toBe(true);
        expect(
            html.includes(
                "Erika Mustermann<br />\nMusterstraße 1<br />\n12345 Musterstadt",
            ),
        ).toBe(true);
        expect(
            html.includes(
                '<a href="mailto:kontakt@example.org">kontakt@example.org</a>',
            ),
        ).toBe(true);
    }),

    test("the privacy notice names the host and the log's lifetime", () => {
        const html = legal.privacyPage(operator());
        expect(
            html.includes("Unser Server läuft bei Example Hosting GmbH"),
        ).toBe(true);
        expect(
            html.includes("Our server is hosted by Example Hosting GmbH"),
        ).toBe(true);
        expect(html.includes(`nach ${legal.LOG_DAYS} Tagen gelöscht`)).toBe(
            true,
        );
        expect(html.includes(`after ${legal.LOG_DAYS} days`)).toBe(true);
    }),

    test("both pages call the site by its host name", () => {
        const o = operator();
        const impressum = legal.impressumPage(o);
        expect(impressum.includes(`<title>Impressum – ${HOST}</title>`)).toBe(
            true,
        );
        expect(impressum.includes(`<p>${HOST} ist kein offizielles`)).toBe(
            true,
        );
        expect(impressum.includes(`<p>${HOST} is not an official`)).toBe(true);
        const privacy = legal.privacyPage(o);
        expect(privacy.includes(`<p>${HOST} zeigt die Abfahrten`)).toBe(true);
        expect(privacy.includes(`<p>${HOST} shows the departures`)).toBe(true);
        for (const html of [impressum, privacy]) {
            expect(html.includes("mulambda")).toBe(false);
        }
    }),

    test("Cloudflare is told to leave every email address alone", () => {
        const o = operator();
        for (const html of [legal.impressumPage(o), legal.privacyPage(o)]) {
            const all = html.split("mailto:").length - 1;
            const kept =
                html.split(
                    '<!--email_off--><a href="mailto:kontakt@example.org">' +
                        "kontakt@example.org</a><!--/email_off-->",
                ).length - 1;
            expect(all > 0).toBe(true);
            expect(kept).toBe(all);
        }
    }),

    test("the operator's details are escaped", () => {
        const o = {
            ...operator(),
            name: "<script>alert(1)</script>",
            email: 'a"b@example.org',
        };
        for (const html of [legal.impressumPage(o), legal.privacyPage(o)]) {
            expect(html.includes("<script>")).toBe(false);
            expect(html.includes("&lt;script&gt;")).toBe(true);
            expect(html.includes('mailto:a&quot;b@example.org"')).toBe(true);
        }
    }),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
