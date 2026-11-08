import * as fs from "node:fs/promises";
import express from "express";
import * as yaml from "yaml";

import { info, request, queryDepartures } from "shared";

import { ProxyFetcher } from "./proxyFetcher.ts";
import { loadStops } from "./data.ts";
import { lines } from "./lines.ts";
import { Handlers } from "./handlers.ts";
import * as legal from "./legal.ts";

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

    // Without an operator file, as on the kiosk, both pages are 404.
    if (operatorFile) {
        const operator = await loadOperator(operatorFile);
        const send = (html: string) => (_: unknown, res: express.Response) => {
            res.setHeader("Cache-Control", "max-age=3600");
            res.type("html").send(html);
        };
        app.get("/impressum", send(legal.impressumPage(operator)));
        app.get("/datenschutz", send(legal.privacyPage(operator)));
    }

    app.use("/", express.static("../www/"));
    app.use("/fonts", express.static("../fonts"));

    app.listen(port, (e) => {
        // Express 5 calls this on failure too, such as a port already in use.
        if (e) throw e;
        console.log("The application is listening on port " + port + "!");
        onReady();
    });
}
