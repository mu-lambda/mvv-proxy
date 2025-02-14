import * as fs from "node:fs/promises";
import express from "express";
import * as yaml from "yaml";

import { info, request, queryDepartures } from "shared";

import { ProxyFetcher } from "./proxyFetcher";
import { loadStops } from "./data";
import { lines } from "./lines";
import { Handlers } from "./handlers";

const app = express();
const port = process.env.MVV_PROXY_PORT || 3000;
const stopsFile = process.env.MVV_PROXY_STOPS_FILE || "./data/stops.csv";
const requestFile = process.env.MVV_PROXY_REQUEST_FILE || "./data/request.yaml";

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
    const handlers = new Handlers(q, fetcher, request);
    app.get("/api/v1/timetable", handlers.timetableApi);
    app.get("/api/v1/stopsNearby", handlers.stopsNearby);
    app.get("/api/v1/lines", handlers.lines);
    app.get("/api/v1/stops", handlers.stops);

    app.get("/svg/*", handlers.svg);

    app.use("/", express.static("../www/"));
    app.use("/fonts", express.static("../fonts"));

    app.listen(port, () => {
        console.log("The application is listening on port " + port + "!");
        onReady();
    });
}
