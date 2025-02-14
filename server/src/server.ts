import * as fs from "node:fs/promises";
import express from "express";
import * as yaml from "yaml";

import { info, request } from "shared";

import * as queryDepartures from "./queryDepartures";
import { ProxyFetcher } from "./proxyFetcher";
import { loadStops } from "./data";
import { Handlers } from "./handlers";

const app = express();
const port = process.env.MVV_PROXY_PORT || 3000;
const stopsFile = process.env.MVV_PROXY_STOPS_FILE || "./data/stops.csv";
const requestFile = process.env.MVV_PROXY_REQUEST_FILE || "./data/request.yaml";
const cssFile = process.env.MVV_PROXY_CSS_FILE || "./data/index.css";

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

    console.log(`Using css ${cssFile}`);
    const cssContent = await fs.readFile(cssFile, { encoding: "utf-8" });
    const fetcher = new ProxyFetcher();
    const q = new queryDepartures.Q(stops, fetcher);
    const request = await loadAndValidateRequest(requestFile, q);

    // Routing to handlers.
    const handlers = new Handlers(q, fetcher, request);
    app.get("/timetable", handlers.timetable);
    app.get("/api/v1/timetable", handlers.timetableApi);
    app.get("/lines", handlers.lines);
    app.get("/stops", handlers.stops);
    app.get("/nearby", handlers.nearby);
    app.get("/svg/*", handlers.svg);

    // Static routing.
    app.get("/index.css", (_, res) => {
        res.setHeader("content-type", "text/css");
        res.send(cssContent);
    });
    app.use("/", express.static("../www/"));
    app.use("/fonts", express.static("../fonts"));
    app.use("/data/index.css", express.static("data/index.css"));

    app.listen(port, () => {
        console.log("The application is listening on port " + port + "!");
        onReady();
    });
}
