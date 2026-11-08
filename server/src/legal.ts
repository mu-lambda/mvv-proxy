/**
 * The Impressum and the privacy notice. Who runs the site comes from a file
 * on the server (MVV_PROXY_OPERATOR_FILE), so the address stays out of the
 * repository and the image. `data/operator.example.yaml` shows the format.
 *
 * The privacy notice describes what the site does. Change it with the code:
 * a new request to another host, a new log line with personal data, or
 * anything stored in the browser.
 */
import * as yaml from "yaml";

/** Who runs the site. */
export type Operator = {
    name: string;
    /** Postal address, one line each. */
    address: string[];
    email: string;
    /** The hosting provider: name and address. */
    hosting: string;
};

/** How long the server's logs are kept. The server must be set up to match. */
export const LOG_DAYS = 14;

/** The date the notices were last changed, as they show it. */
const AS_OF = { de: "November 2026", en: "November 2026" };

/** The operator described by the YAML, or the problems with it. */
export function parseOperator(text: string): Operator | string[] {
    const errors: string[] = [];
    let o: unknown;
    try {
        o = yaml.parse(text);
    } catch (e) {
        return [`not YAML: ${(e as Error).message}`];
    }
    if (typeof o !== "object" || o === null) {
        return ["expected name, address, email and hosting"];
    }
    const r = o as Record<string, unknown>;
    const field = (key: string): string => {
        const v = r[key];
        if (typeof v !== "string" || v.trim() === "") {
            errors.push(`${key}: expected text`);
            return "";
        }
        return v.trim();
    };
    const name = field("name");
    const email = field("email");
    const hosting = field("hosting");
    if (email !== "" && !/^[^\s@]+@[^\s@]+$/.test(email)) {
        errors.push("email: not an address");
    }
    const a = r.address;
    let address: string[] = [];
    if (
        !Array.isArray(a) ||
        a.length === 0 ||
        !a.every((l) => typeof l === "string" && l.trim() !== "")
    ) {
        errors.push("address: expected a list of lines");
    } else {
        address = a.map((l: string) => l.trim());
    }
    if (errors.length > 0) {
        return errors;
    }
    return { name, address, email, hosting };
}

function escapeHtml(s: string): string {
    return s.replace(
        /[&<>"']/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[c]!,
    );
}

/**
 * The email address as a link. Cloudflare's email obfuscation would replace
 * it with "[email protected]" and a script to decode it, but an Impressum
 * must show the address as it is; Cloudflare leaves what is between these
 * comments alone.
 */
function emailLink(o: Operator): string {
    const email = escapeHtml(o.email);
    return (
        `<!--email_off--><a href="mailto:${email}">${email}</a>` +
        `<!--/email_off-->`
    );
}

/** Name, address and email, as both pages show them. */
function contact(o: Operator, emailLabel: string): string {
    const lines = [o.name, ...o.address].map(escapeHtml).join("<br />\n");
    return `<p>${lines}</p>\n<p>${emailLabel}: ${emailLink(o)}</p>`;
}

function page(title: string, german: string, english: string): string {
    return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title} – mvv.mulambda.de</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="stylesheet" href="/fonts/librefranklin/librefranklin.css" />
<style>
body { font-family: "Libre Franklin", sans-serif; line-height: 1.5; margin: 0; }
header { background: #c0d101; padding: 12px 16px; }
header a { color: black; }
main { max-width: 40em; padding: 0 16px 32px; margin: 0 auto; }
h1 { font-size: 1.6em; }
h2 { font-size: 1.15em; margin-top: 1.5em; }
hr { margin: 2.5em 0; }
</style>
</head>
<body>
<header><a href="/">← Abfahrten in der Nähe / Departures nearby</a></header>
<main>
${german}
<hr />
<div lang="en">
${english}
</div>
</main>
</body>
</html>
`;
}

export function impressumPage(o: Operator): string {
    const german = `<h1>Impressum</h1>
<p>Angaben gemäß § 5 DDG</p>
${contact(o, "E-Mail")}
<p>mvv.mulambda.de ist kein offizielles Angebot des MVV. Die Abfahrten und
die meisten Liniensymbole stammen von der Münchner Verkehrs- und
Tarifverbund GmbH (MVV); alle Angaben ohne Gewähr.</p>`;
    const english = `<h1>Legal notice</h1>
<p>Information under § 5 DDG (German Digital Services Act). If in doubt,
the German version applies.</p>
${contact(o, "Email")}
<p>mvv.mulambda.de is not an official service of MVV. Departures and most
line icons come from Münchner Verkehrs- und Tarifverbund GmbH (MVV); no
guarantee that they are correct.</p>`;
    return page("Impressum", german, english);
}

export function privacyPage(o: Operator): string {
    const hosting = escapeHtml(o.hosting);
    const mail = emailLink(o);
    const german = `<h1>Datenschutzerklärung</h1>
<p>Stand: ${AS_OF.de}</p>

<h2>Verantwortlich</h2>
${contact(o, "E-Mail")}

<h2>Kurz gesagt</h2>
<p>mvv.mulambda.de zeigt die Abfahrten an den Haltestellen in Ihrer Nähe.
Es gibt keine Anmeldung, keine Cookies, kein Tracking und keine
Analysewerkzeuge. Ihren Standort brauchen wir nur, um die Haltestellen in
Ihrer Nähe zu finden.</p>

<h2>Aufruf der Website</h2>
<p>Die Website wird über Cloudflare ausgeliefert (Cloudflare, Inc., 101
Townsend St., San Francisco, CA 94107, USA). Cloudflare verarbeitet dabei
in unserem Auftrag Ihre IP-Adresse, die aufgerufene Adresse, Datum und
Uhrzeit sowie Angaben Ihres Browsers, um die Website auszuliefern und vor
Angriffen zu schützen. Dabei können Daten in die USA übermittelt werden;
Cloudflare ist nach dem EU-US Data Privacy Framework zertifiziert.
Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren und
schnellen Auslieferung (Art. 6 Abs. 1 lit. f DSGVO).</p>
<p>Unser Server läuft bei ${hosting}. Er speichert keine IP-Adressen.</p>

<h2>Ihr Standort</h2>
<p>Wenn Sie es in Ihrem Browser erlauben, schickt die Seite Ihren Standort
an unseren Server, der daraus die Haltestellen in Ihrer Nähe bestimmt.
Dasselbe gilt, wenn Sie einen Link mit Koordinaten öffnen
(<code>?lat=…&amp;long=…</code>). Der Server speichert den Standort nicht.
Er schreibt ihn nur auf zwei Nachkommastellen gerundet (etwa 1 km genau)
in sein Protokoll, um zu sehen, wo die Seite genutzt wird, und zur
Fehlersuche. Das Protokoll wird nach ${LOG_DAYS} Tagen gelöscht.</p>
<p>Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die
Sie mit der Standortfreigabe erteilen und in den Einstellungen Ihres
Browsers jederzeit widerrufen können; für das gerundete Protokoll unser
berechtigtes Interesse an Betrieb und Fehlersuche (Art. 6 Abs. 1 lit. f
DSGVO).</p>

<h2>Abfahrten vom MVV</h2>
<p>Die Abfahrten ruft Ihr Browser direkt bei der Münchner Verkehrs- und
Tarifverbund GmbH (MVV) ab, unter www.mvv-muenchen.de. Der MVV erhält dabei
Ihre IP-Adresse und die Haltestellen in Ihrer Nähe, also auch Ihren
ungefähren Standort. Dafür ist der MVV verantwortlich, und es gilt seine
Datenschutzerklärung. Ohne diesen Abruf kann die Seite keine Abfahrten
zeigen; Rechtsgrundlage ist unser berechtigtes Interesse, Ihnen die
gewünschten Abfahrten zu zeigen (Art. 6 Abs. 1 lit. f DSGVO).</p>
<p>Die Liniensymbole holt dagegen unser Server beim MVV. Dabei erfährt der
MVV nichts über Sie.</p>

<h2>Schriften, Cookies und Links</h2>
<p>Schriften und Bilder kommen von unserem Server. Die Seite setzt keine
Cookies und legt nichts im Speicher Ihres Browsers ab. Die Links zu PayPal
(Spenden) und Google Maps (Orte und Wege) führen erst beim Anklicken zu
diesen Anbietern; dann gelten deren Datenschutzerklärungen. Ein
Google-Maps-Link enthält die Koordinaten des Ortes, auf den er zeigt.</p>

<h2>Ihre Rechte</h2>
<p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung
(Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18)
und Datenübertragbarkeit (Art. 20), und Sie können der Verarbeitung auf
Grundlage berechtigter Interessen widersprechen (Art. 21). Eine
Einwilligung können Sie jederzeit für die Zukunft widerrufen. Außerdem
können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren
(Art. 77 DSGVO). Da wir außer gerundeten Standorten nichts speichern,
können wir Ihnen meist keine Daten zuordnen. Schreiben Sie uns an
${mail}.</p>`;
    const english = `<h1>Privacy notice</h1>
<p>As of ${AS_OF.en}. If in doubt, the German version applies.</p>

<h2>Controller</h2>
${contact(o, "Email")}

<h2>In short</h2>
<p>mvv.mulambda.de shows the departures from the stops near you. There is
no login, no cookies, no tracking and no analytics. We need your location
only to find the stops near you.</p>

<h2>Visiting the site</h2>
<p>The site is delivered through Cloudflare (Cloudflare, Inc., 101
Townsend St., San Francisco, CA 94107, USA). On our behalf, Cloudflare
processes your IP address, the address requested, the date and time, and
information about your browser, to deliver the site and protect it from
attacks. Data may be transferred to the USA; Cloudflare is certified under
the EU-US Data Privacy Framework. The legal basis is our legitimate
interest in delivering the site securely and quickly (Art. 6(1)(f)
GDPR).</p>
<p>Our server is hosted by ${hosting}. It does not store IP addresses.</p>

<h2>Your location</h2>
<p>If you allow it in your browser, the page sends your location to our
server, which uses it to find the stops near you. The same happens when
you open a link with coordinates (<code>?lat=…&amp;long=…</code>). The
server does not store the location. It writes it to its log only rounded
to two decimal places (to about 1 km), to see where the site is used and
to find faults. The log is deleted after ${LOG_DAYS} days.</p>
<p>The legal basis is your consent (Art. 6(1)(a) GDPR), which you give by
sharing your location and can withdraw at any time in your browser's
settings; for the rounded log, our legitimate interest in running the site
and finding faults (Art. 6(1)(f) GDPR).</p>

<h2>Departures from MVV</h2>
<p>Your browser fetches the departures directly from Münchner Verkehrs-
und Tarifverbund GmbH (MVV), at www.mvv-muenchen.de. MVV receives your IP
address and the stops near you, and so your approximate location. MVV is
responsible for this, and its privacy policy applies. Without it the page
cannot show departures; the legal basis is our legitimate interest in
showing you the departures you asked for (Art. 6(1)(f) GDPR).</p>
<p>The line icons, on the other hand, are fetched from MVV by our server.
MVV learns nothing about you from that.</p>

<h2>Fonts, cookies and links</h2>
<p>Fonts and images come from our server. The page sets no cookies and
stores nothing in your browser. The links to PayPal (donations) and Google
Maps (places and directions) reach those services only when you click
them, and then their privacy policies apply. A Google Maps link contains
the coordinates of the place it points to.</p>

<h2>Your rights</h2>
<p>You have the right of access (Art. 15 GDPR), rectification (Art. 16),
erasure (Art. 17), restriction of processing (Art. 18) and data
portability (Art. 20), and you can object to processing based on
legitimate interests (Art. 21). You can withdraw consent at any time for
the future. You can also complain to a data protection supervisory
authority (Art. 77 GDPR). As we store nothing but rounded locations, we
usually cannot link any data to you. Write to us at ${mail}.</p>`;
    return page("Datenschutz", german, english);
}
