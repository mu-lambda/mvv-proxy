import * as express from "express";

import * as lines from "./lines";
import * as queryDepartures from "./queryDepartures";
import type { Stop, LatLong } from "./info";
import * as request from "./request";
import { Renderer, GeoRenderer } from "./render";
import * as geo from "./geo";
import { StringCache } from "./stringCache";

export class Handlers {
    #q: queryDepartures.Q;
    #stops: Stop[];
    #defaultRequest: request.MultiStop | undefined;
    #locator: geo.Locator;
    #stringCache: StringCache;

    constructor(
        q: queryDepartures.Q,
        defaultRequest: request.MultiStop | undefined,
    ) {
        this.#q = q;
        this.#defaultRequest = defaultRequest;
        this.#stops = q.stops();
        this.#locator = new geo.Locator(this.#stops);
        this.#stringCache = new StringCache();
    }

    private handleError(e: any, res: express.Response) {
        if (e instanceof queryDepartures.MVVRequestFailure) {
            const m = (e as queryDepartures.MVVRequestFailure).message;
            res.send(`MVV API Request failed: ${m}`);
        } else {
            console.log(`${(e as Error).stack}`);
            res.send(e as Error).toString();
        }
    }

    timetable = async (req: express.Request, res: express.Response) => {
        if (!this.#defaultRequest) {
            res.sendStatus(404);
            return;
        }
        const t = req.query.timestamp ? +req.query.timestamp : NaN;
        if (isNaN(t)) {
            res.sendStatus(404);
            return;
        }
        const timestamp = new Date(t * 1000);
        try {
            const d = await this.#q.getDeparturesForMultipleStops(
                this.#defaultRequest,
                timestamp,
            );

            res.send(
                new Renderer(
                    this.#stringCache,
                    timestamp,
                    this.#defaultRequest,
                ).render(d),
            );
        } catch (e) {
            this.handleError(e, res);
        }
    };

    lines = async (_: express.Request, res: express.Response) => {
        res.send(JSON.stringify(lines.lines));
    };

    stops = (req: express.Request, res: express.Response) => {
        const town: string | undefined = req.query.town?.toString();
        if (town !== undefined) {
            const result = this.#stops.filter((s) => s.town === town);
            res.send(JSON.stringify(result));
        } else {
            res.send(JSON.stringify(this.#stops));
        }
    };

    nearby = async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ) => {
        const p: LatLong = {
            latitude: req.query.lat ? +req.query.lat : NaN,
            longitude: req.query.long ? +req.query.long : NaN,
        };
        const distance: number = req.query.d ? +req.query.d : 500;
        const t = req.query.timestamp ? +req.query.timestamp : NaN;
        if (
            isNaN(p.latitude) ||
            isNaN(p.longitude) ||
            isNaN(distance) ||
            isNaN(t)
        ) {
            next(
                new Error(
                    "lat, long, d, or timestamp are missing or not numbers",
                ),
            );
            return;
        }
        try {
            const stops = this.#locator.findStops(p, distance);
            const multistop = this.stopsWithDistanceToRequests(stops);

            const now = new Date(t * 1000);
            const d = await this.#q.getDeparturesForMultipleStops(
                multistop,
                now,
            );

            res.set("Cache-Control", "no-store");
            res.send(
                new GeoRenderer(
                    this.#stringCache,
                    now,
                    p,
                    multistop,
                    stops,
                ).render(d),
            );
        } catch (e) {
            this.handleError(e, res);
        }
    };

    private stopsWithDistanceToRequests(
        ss: geo.StopWithDistance[],
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
}
