import * as fs from "node:fs/promises";
import express from "express";
import * as yaml from "yaml";

import { info, request, queryDepartures, strings } from "shared";

import { ProxyFetcher } from "./proxyFetcher.ts";
import { loadStops } from "./data.ts";
import { lines } from "./lines.ts";
import { Handlers } from "./handlers.ts";
import * as legal from "./legal.ts";
import * as page from "./page.ts";
import { StaticFiles, notFound } from "./staticFiles.ts";

const app = express();
// Error pages without stack traces, however the server was started. Express
// still logs the stack.
app.set("env", "production");
const port = process.env.MVV_PROXY_PORT || 3000;
const stopsFile = process.env.MVV_PROXY_STOPS_FILE || "./data/stops.csv";
const requestFile = process.env.MVV_PROXY_REQUEST_FILE || "./data/request.yaml";
/** Who runs the site, for the Impressum and privacy notice. */
const operatorFile = process.env.MVV_PROXY_OPERATOR_FILE;

/** The operator file, checked; a broken one stops the server. */
async function loadOperator(filename: string): Promise<legal.Operator> {
    const o = legal.parseOperator(
        await fs.readFile(filename, { encoding: "utf-8" }),
    );
    if (Array.isArray(o)) {
        throw Error(`Error loading ${filename}: ${o.join("; ")}`);
    }
    return o;
}

async function loadAndValidateRequest(
    filename: string,
    q: queryDepartures.Q,
): Promise<request.MultiStop | undefined> {
    let content;
    try {
        content = await fs.readFile(filename, { encoding: "utf-8" });
    } catch (e) {
        return undefined;
    }
    const request = yaml.parse(content) as request.MultiStop;
    console.log(`Request parsed: ${JSON.stringify(request)}`);
    const errors = q.validateRequestReturningErrors(request);
    if (errors.length > 0) {
        console.log(`Error parsing ${filename}:`);
        errors.forEach((s) => console.log(s));
        throw Error(`Error loading ${filename}`);
    }
    return request;
}

export async function server(onReady: () => void) {
    const stops: info.Stop[] = [];
    for await (const s of loadStops(stopsFile)) {
        stops.push(s);
    }

    const fetcher = new ProxyFetcher();
    const q = new queryDepartures.Q(lines, stops, fetcher);
    const request = await loadAndValidateRequest(requestFile, q);

    // Routing to handlers.
    // Icons are tried once: a missing icon only means the line's name shows
    // as text for a while, and each try spends the icon budget.
    const handlers = new Handlers(q, new ProxyFetcher(1), request);
    app.get("/api/v1/timetable", handlers.timetableApi);
    app.get("/api/v1/stopsNearby", handlers.stopsNearby);
    app.get("/api/v1/lines", handlers.lines);
    app.get("/api/v1/stops", handlers.stops);

    app.get("/svg/*filename", handlers.svg);

    // Without an operator file, as on the kiosk, both pages are 404, and the
    // nearby page has no host to link to.
    const operator = operatorFile
        ? await loadOperator(operatorFile)
        : undefined;
    const host = operator?.host;
    const files = await StaticFiles.load({
        "/": "../www",
        "/fonts": "../fonts",
    });
    const url = (path: string) => files.url(path);
    if (operator) {
        // Served like the static files, so the nearby page links them with
        // their versions. Added before that page is written.
        files.add("/impressum", legal.impressumPage(operator, url), "html");
        files.add("/datenschutz", legal.privacyPage(operator, url), "html");
    }

    // The nearby page, in each language (page.ts). Before the static files,
    // which no longer have an index.html.
    // At / the page is in whichever language the browser prefers.
    const atRoot = Object.fromEntries(
        strings.LANGS.map((l) => [l, page.nearbyPage(l, "auto", host, url)]),
    ) as Record<strings.Lang, string>;
    // max-age=0 keeps deploys instant, and keeps / right: Cloudflare
    // keeps a copy but ignores Vary, so it must fetch / again every time.
    const sendPage = (html: string, res: express.Response) => {
        res.setHeader("Cache-Control", "max-age=0");
        res.type("html").send(html);
    };
    app.get(["/", "/index.html"], (req, res) => {
        const lang = strings.pickLang(req.acceptsLanguages(...strings.LANGS));
        // Caches must keep one copy per language.
        res.setHeader("Vary", "Accept-Language");
        sendPage(atRoot[lang], res);
    });
    for (const lang of strings.LANGS) {
        const html = page.nearbyPage(lang, lang, host, url);
        app.get(`/${lang}`, (_, res) => sendPage(html, res));
        const json = page.manifest(lang);
        app.get(`/${lang}.webmanifest`, (_, res) => {
            res.setHeader("Cache-Control", "max-age=86400");
            res.type("application/manifest+json").send(json);
        });
    }

    app.use(files.router());
    app.use(notFound);

    app.listen(port, (e) => {
        // Express 5 calls this on failure too, such as a port already in use.
        if (e) throw e;
        console.log("The application is listening on port " + port + "!");
        onReady();
    });
}
