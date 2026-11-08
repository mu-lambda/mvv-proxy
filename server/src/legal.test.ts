import * as fs from "node:fs";
import { testing as harness } from "shared";

import * as legal from "./legal.ts";

const { suite, test, expect } = harness;

const EXAMPLE = fs.readFileSync("data/operator.example.yaml", "utf-8");

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
    }),

    test("a broken operator file says what is wrong", () => {
        const errors = legal.parseOperator(
            "name: ''\naddress: Musterstraße 1\nemail: nobody\n",
        );
        expect(Array.isArray(errors)).toBe(true);
        expect((errors as string[]).join("; ")).toBe(
            "name: expected text; hosting: expected text; " +
                "email: not an address; address: expected a list of lines",
        );
        expect(Array.isArray(legal.parseOperator("just text"))).toBe(true);
        expect(Array.isArray(legal.parseOperator("a: [unclosed"))).toBe(true);
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
