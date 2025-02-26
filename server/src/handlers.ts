import * as express from "express";
import * as path from "path";
import { info, request, fetcher, queryDepartures } from "shared";

import * as lines from "./lines";
import * as geo from "./geo";

type Stop = info.Stop;
type LatLong = info.LatLong;

export class Handlers {
    #q: queryDepartures.Q;
    #stops: Stop[];
    #defaultRequest: request.MultiStop | undefined;
    #locator: geo.Locator;
    readonly #fetcher: fetcher.IFetcher;
    readonly #svgCache = new Map<string, string>();

    constructor(
        q: queryDepartures.Q,
        f: fetcher.IFetcher,
        defaultRequest: request.MultiStop | undefined,
    ) {
        this.#q = q;
        this.#fetcher = f;
        this.#defaultRequest = defaultRequest;
        this.#stops = q.stops();
        this.#locator = new geo.Locator(this.#stops);
    }

    timetableApi = async (req: express.Request, res: express.Response) => {
        if (!this.#defaultRequest) {
            res.status(404).send("server not configured for default timetable");
            return;
        }
        const t = req.query.timestamp ? +req.query.timestamp : NaN;
        if (isNaN(t)) {
            res.status(404).send("timestamp should be a number");
            return;
        }
        const timestamp = new Date(t * 1000);
        try {
            const d = await this.#q.getDeparturesForMultipleStops(
                this.#defaultRequest,
                timestamp,
            );

            let result: request.TimetableResponse = {
                date: timestamp.getTime(),
                request: this.#defaultRequest,
                departures: d,
            };
            res.send(result);
        } catch (e) {
            console.log(`${(e as Error).stack}`);
            res.status(500).send((e as any)?.message ?? "");
        }
    };

    lines = async (_: express.Request, res: express.Response) => {
        res.send(JSON.stringify(lines.lines));
    };

    stops = (req: express.Request, res: express.Response) => {
        const town: string | undefined = req.query.town?.toString();
        if (town !== undefined) {
            const result = this.#stops.filter((s) => s.town === town);
            res.send(result);
        } else {
            res.send(this.#stops);
        }
    };

    stopsNearby = (req: express.Request, res: express.Response) => {
        const p: LatLong = {
            latitude: req.query.lat ? +req.query.lat : NaN,
            longitude: req.query.long ? +req.query.long : NaN,
        };
        const distance: number = req.query.d ? +req.query.d : 500;
        if (isNaN(p.latitude) || isNaN(p.longitude) || isNaN(distance)) {
            throw new Error(
                "lat, long, d, or timestamp are missing or not numbers",
            );
        }
        console.log(`stops nearby: ${p.latitude} ${p.longitude} ${distance}`);
        const stops = this.#locator.findStops(p, distance);
        const multistop = this.stopsWithDistanceToRequests(stops);
        const result: request.NearbyStopsResponse = {
            stops,
            request: multistop,
        };
        res.send(result);
    };

    private stopsWithDistanceToRequests(
        ss: info.StopWithDistance[],
    ): request.MultiStop {
        const predestrianSpeed = 60; // meter/min
        let result: request.MultiStop = { stops: [], limit: 30 };
        for (const s of ss) {
            result.stops.push({
                stopGid: s.stop.gid,
                lines: [],
                timeToStop: s.distance / predestrianSpeed,
            });
        }
        return result;
    }

    svg = async (req: express.Request, res: express.Response) => {
        const filename = path.basename(req.path);
        if (!filename.endsWith(".svg")) {
            res.sendStatus(404);
            return;
        }
        if (this.#svgCache.has(filename)) {
            console.log(`Sending cached ${filename}`);
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", "max-age=864000");
            res.send(this.#svgCache.get(filename));
            return;
        }
        try {
            const r = await this.#fetcher.fetch(
                `https://www.mvv-muenchen.de/fileadmin/lines/${filename}`,
            );
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", "max-age=864000");
            const text = await r.text();
            this.#svgCache.set(filename, text);
            res.send(text);
            return;
        } catch (e) {
            res.sendStatus(404);
        }
    };
}
