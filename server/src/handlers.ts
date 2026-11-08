import * as express from "express";
import * as path from "path";
import { info, request, fetcher, queryDepartures } from "shared";

import { lines } from "./lines.ts";
import * as geo from "./geo.ts";
import * as icons from "./icons.ts";
import { Budget, Concurrency } from "./limits.ts";

type Stop = info.Stop;
type LatLong = info.LatLong;

/** How long MVV's answer for an icon is kept: the icon, or that it has none. */
const ICON_TTL_MS = 24 * 60 * 60 * 1000;
/**
 * At most this many answers are kept; the oldest go first. More than a day's
 * budget, so names nobody uses can't push out the icons people see.
 */
const MAX_ICONS = 10000;
/** MVV's icon names: five capitals or digits ("02019.svg", "920S6.svg"). */
const MVV_ICON_NAME = /^[0-9A-Z]{5}\.svg$/;

/**
 * Requests to MVV for icons: how many may be made, and how many at once.
 * Only cache misses count. Without a limit, anyone could make the server ask
 * MVV for one made-up name after another.
 */
export type IconLimits = {
    /** Requests that may be made at once, such as for a page of new icons. */
    burst: number;
    /** After the burst, one more request every this many milliseconds. */
    refillMs: number;
    /** Requests in flight at once; the rest wait. */
    concurrent: number;
};

/**
 * Burst 1,500, enough for a restart's empty cache, then about 4,000 a day,
 * 8 at a time.
 */
export const ICON_LIMITS: IconLimits = {
    burst: 1500,
    refillMs: ICON_TTL_MS / 4000,
    concurrent: 8,
};

/** The icon budget is spent, so MVV wasn't asked. */
class OutOfBudget extends Error {}

type IconEntry = {
    fetchedAt: number;
    /** MVV's icon, or undefined if MVV has none (404 or 410). */
    icon: Promise<string | undefined>;
};

export class Handlers {
    #q: queryDepartures.Q;
    #stops: Stop[];
    #defaultRequest: request.MultiStop | undefined;
    #locator: geo.Locator;
    readonly #fetcher: fetcher.IFetcher;
    readonly #now: () => number;
    /**
     * MVV's answer for each icon asked for, so MVV is asked at most once a
     * day per icon, however many clients ask. mvv-proxy also runs on the
     * internet, where asking MVV for every request could get us rate-limited.
     */
    readonly #icons = new Map<string, IconEntry>();
    readonly #iconBudget: Budget;
    readonly #iconConcurrency: Concurrency;
    /** Whether running out of budget has been logged since it last had some. */
    #outOfBudgetLogged = false;

    /**
     * `f` fetches icons. `now` gives the time in milliseconds; tests replace
     * it, and the limits.
     */
    constructor(
        q: queryDepartures.Q,
        f: fetcher.IFetcher,
        defaultRequest: request.MultiStop | undefined,
        now: () => number = Date.now,
        iconLimits: IconLimits = ICON_LIMITS,
    ) {
        this.#q = q;
        this.#fetcher = f;
        this.#now = now;
        this.#iconBudget = new Budget(
            iconLimits.burst,
            iconLimits.refillMs,
            now,
        );
        this.#iconConcurrency = new Concurrency(iconLimits.concurrent);
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
        res.send(JSON.stringify(lines));
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
            res.status(400).send("lat, long or d are missing or not numbers");
            return;
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

    /** The line a request for an icon describes, if it describes one. */
    private lineForIcon(
        query: express.Request["query"],
    ): icons.LineForIcon | undefined {
        const param = (name: string) => {
            const v = query[name];
            return typeof v === "string" && v.length <= 40 ? v : undefined;
        };
        const name = param("name");
        const product = param("product");
        if (!name || product === undefined) {
            return undefined;
        }
        return { name, product, id: param("id") };
    }

    /**
     * MVV's icon, or the one it has under another name (icons.renamedIcon).
     * Undefined if MVV has neither; throws if MVV couldn't say, or if the
     * budget is spent. Each request to MVV spends one.
     */
    private async fetchIcon(filename: string): Promise<string | undefined> {
        const fetchText = async (f: string) => {
            if (!this.#iconBudget.take()) {
                if (!this.#outOfBudgetLogged) {
                    console.log(
                        "Icon budget spent: new icons are not asked for " +
                            "until it refills",
                    );
                    this.#outOfBudgetLogged = true;
                }
                throw new OutOfBudget();
            }
            this.#outOfBudgetLogged = false;
            return this.#iconConcurrency.run(async () =>
                (
                    await this.#fetcher.fetch(
                        `https://www.mvv-muenchen.de/fileadmin/lines/${f}`,
                    )
                ).text(),
            );
        };
        try {
            return await fetchText(filename);
        } catch (e) {
            if (!isMissing(e)) {
                throw e;
            }
        }
        const renamed = icons.renamedIcon(filename);
        if (renamed === undefined) {
            return undefined;
        }
        try {
            return await fetchText(renamed);
        } catch (e) {
            if (!isMissing(e)) {
                throw e;
            }
            return undefined;
        }
    }

    /**
     * MVV's answer for an icon, asked for at most once a day. Requests that
     * arrive while MVV is being asked wait for the same answer. A failed
     * request is not kept, so the next one asks again.
     */
    private mvvIcon(filename: string): Promise<string | undefined> {
        const now = this.#now();
        const cached = this.#icons.get(filename);
        if (cached !== undefined && now - cached.fetchedAt < ICON_TTL_MS) {
            return cached.icon;
        }
        const entry: IconEntry = {
            fetchedAt: now,
            icon: this.fetchIcon(filename),
        };
        // Re-inserted, so the map stays in fetch order for eviction.
        this.#icons.delete(filename);
        this.#icons.set(filename, entry);
        for (const oldest of this.#icons.keys()) {
            if (this.#icons.size <= MAX_ICONS) {
                break;
            }
            this.#icons.delete(oldest);
        }
        entry.icon.catch(() => {
            if (this.#icons.get(filename) === entry) {
                this.#icons.delete(filename);
            }
        });
        return entry.icon;
    }

    /**
     * A line icon: MVV's, under its own name or another, or one drawn in
     * MVV's template when MVV has none (see MVV-ICONS.md). Drawing needs the
     * line, so the client passes name, product and id as query parameters.
     */
    svg = async (req: express.Request, res: express.Response) => {
        const filename = path.basename(req.path);
        // Anything else can't be MVV's, so MVV isn't asked.
        if (!MVV_ICON_NAME.test(filename)) {
            res.sendStatus(404);
            return;
        }
        const sendDrawn = (line: icons.LineForIcon) => {
            res.setHeader("Content-Type", "image/svg+xml");
            // Shorter than for MVV's icons, in case MVV adds the real one.
            res.setHeader("Cache-Control", "max-age=86400");
            res.send(icons.drawIcon(line));
        };
        const override = icons.overrides.get(filename);
        if (override !== undefined) {
            sendDrawn(override);
            return;
        }
        let icon: string | undefined;
        try {
            icon = await this.mvvIcon(filename);
        } catch {
            // MVV couldn't say, or wasn't asked: the client shows the line's
            // name, and the next request asks MVV again. Not to be cached:
            // Cloudflare would otherwise keep the 404 for hours.
            res.setHeader("Cache-Control", "no-store");
            res.sendStatus(404);
            return;
        }
        if (icon !== undefined) {
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", "max-age=864000");
            res.send(icon);
            return;
        }
        const line = this.lineForIcon(req.query);
        if (line !== undefined) {
            sendDrawn(line);
            return;
        }
        res.sendStatus(404);
    };
}

/**
 * Whether MVV answered that it has no such file. Other 4xx, such as 429 Too
 * Many Requests, say nothing about the file.
 */
function isMissing(e: unknown): boolean {
    const status = (e as fetcher.MVVRequestFailure).status;
    return status === 404 || status === 410;
}
