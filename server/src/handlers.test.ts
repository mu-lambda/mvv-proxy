import type * as express from "express";
import {
    fetcher,
    info,
    queryDepartures,
    request,
    testing as harness,
} from "shared";

import { Handlers, ICON_LIMITS } from "./handlers.ts";
import type { IconLimits } from "./handlers.ts";

const { suite, testAsync, expect } = harness;

type FakeResponse = {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
    status(code: number): FakeResponse;
    sendStatus(code: number): FakeResponse;
    send(body: unknown): FakeResponse;
    setHeader(name: string, value: string): FakeResponse;
};

function fakeResponse(): FakeResponse {
    const r: FakeResponse = {
        statusCode: 200,
        body: undefined,
        headers: {},
        status: (code) => {
            r.statusCode = code;
            return r;
        },
        sendStatus: (code) => {
            r.statusCode = code;
            return r;
        },
        send: (body) => {
            r.body = body;
            return r;
        },
        setHeader: (name, value) => {
            r.headers[name] = value;
            return r;
        },
    };
    return r;
}

/** A fetcher that fails every request the same way, and counts them. */
function failingFetcher(failure: Error) {
    const f = {
        calls: 0,
        fetch: async (_: string): Promise<fetcher.IFetchResult> => {
            f.calls++;
            throw failure;
        },
    };
    return f;
}

/**
 * MVV's icon directory: serves the given files and answers 404 for the
 * rest, recording which files were asked for.
 */
function iconFetcher(files: Record<string, string>) {
    const f = {
        requested: [] as string[],
        fetch: async (url: string): Promise<fetcher.IFetchResult> => {
            const name = url.substring(url.lastIndexOf("/") + 1);
            f.requested.push(name);
            const body = files[name];
            if (body === undefined) {
                throw new fetcher.MVVRequestFailure(
                    new Error("Not Found"),
                    404,
                );
            }
            return { json: async () => body, text: async () => body };
        },
    };
    return f;
}

function handlers(
    f: fetcher.IFetcher,
    now?: () => number,
    limits: IconLimits = ICON_LIMITS,
): Handlers {
    return new Handlers(
        new queryDepartures.Q([], [], f),
        f,
        undefined,
        now,
        limits,
    );
}

const DAY = 24 * 60 * 60 * 1000;

/** A stop `metres` north of Marienplatz. */
function stopNorth(gid: string, metres: number): info.Stop {
    return {
        id: 0,
        name: gid,
        town: "München",
        gid,
        // A degree of latitude is about 111 km.
        location: {
            latitude: 48.13743 + metres / 111_000,
            longitude: 11.57549,
        },
    };
}

/** Handlers that know only `stops`. */
function nearbyHandlers(stops: info.Stop[]): Handlers {
    const f = failingFetcher(new Error("unused"));
    return new Handlers(new queryDepartures.Q([], stops, f), f, undefined);
}

/** The gids stopsNearby returns, and the request it builds. */
async function nearby(
    h: Handlers,
    query: Record<string, string>,
): Promise<{ gids: string[]; request: request.MultiStop }> {
    const res = await call(h.stopsNearby, {
        query: { lat: "48.13743", long: "11.57549", ...query },
    });
    expect(res.statusCode).toBe(200);
    const body = res.body as request.NearbyStopsResponse;
    return { gids: body.stops.map((s) => s.stop.gid), request: body.request };
}

async function call(
    handler: (req: express.Request, res: express.Response) => unknown,
    req: object,
): Promise<FakeResponse> {
    const res = fakeResponse();
    await handler(req as express.Request, res as unknown as express.Response);
    return res;
}

const tests = [
    testAsync("stopsNearby answers bad input with a 400", async () => {
        const h = handlers(failingFetcher(new Error("unused")));
        const res = await call(h.stopsNearby, { query: {} });
        expect(res.statusCode).toBe(400);
        expect(typeof res.body).toBe("string");
    }),

    testAsync("stopsNearby logs the location only roughly", async () => {
        const h = handlers(failingFetcher(new Error("unused")));
        const logged: string[] = [];
        const log = console.log;
        console.log = (...args: unknown[]) => logged.push(args.join(" "));
        try {
            const res = await call(h.stopsNearby, {
                query: { lat: "48.137431", long: "11.575492", d: "400" },
            });
            expect(res.statusCode).toBe(200);
        } finally {
            console.log = log;
        }
        expect(logged.join("\n")).toBe("stops nearby: 48.14 11.58 400 30");
    }),

    testAsync("stopsNearby answers bad minutes with a 400", async () => {
        const h = handlers(failingFetcher(new Error("unused")));
        for (const minutes of ["0", "-5", "soon"]) {
            const res = await call(h.stopsNearby, {
                query: { lat: "48.13743", long: "11.57549", minutes },
            });
            expect(res.statusCode).toBe(400);
        }
    }),

    testAsync("stopsNearby answers a bad d with a 400", async () => {
        const h = handlers(failingFetcher(new Error("unused")));
        for (const d of ["0", "-100", "far"]) {
            const res = await call(h.stopsNearby, {
                query: { lat: "48.13743", long: "11.57549", d },
            });
            expect(res.statusCode).toBe(400);
        }
    }),

    testAsync(
        "stopsNearby leaves out stops too far to walk to in the window",
        async () => {
            const h = nearbyHandlers([
                stopNorth("near", 300),
                stopNorth("mid", 1500),
                stopNorth("far", 3000),
            ]);
            const log = console.log;
            console.log = () => {};
            try {
                // 30 minutes by default: 1,800 m at 60 m a minute.
                const byDefault = await nearby(h, { d: "10000" });
                expect(byDefault.gids.sort().join()).toBe("mid,near");
                expect(byDefault.request.limit).toBe(30);
                expect(Math.round(byDefault.request.stops[0]!.timeToStop)).toBe(
                    5,
                );

                // 10 minutes: 600 m.
                const short = await nearby(h, { d: "10000", minutes: "10" });
                expect(short.gids.join()).toBe("near");
                expect(short.request.limit).toBe(10);

                // 60 minutes: 3,600 m, but d is smaller.
                const long = await nearby(h, { d: "2000", minutes: "60" });
                expect(long.gids.sort().join()).toBe("mid,near");
                expect(long.request.limit).toBe(60);
            } finally {
                console.log = log;
            }
        },
    ),

    testAsync("an icon MVV does not have is asked for once", async () => {
        const f = failingFetcher(
            new fetcher.MVVRequestFailure(new Error("Not Found"), 404),
        );
        const h = handlers(f);
        const first = await call(h.svg, { path: "/svg/99999.svg", query: {} });
        const second = await call(h.svg, { path: "/svg/99999.svg", query: {} });
        expect(first.statusCode).toBe(404);
        expect(second.statusCode).toBe(404);
        // A real answer, so it may be cached.
        expect(first.headers["Cache-Control"]).toBe(undefined);
        expect(f.calls).toBe(1);
    }),

    testAsync("an icon that failed in transit is asked for again", async () => {
        const f = failingFetcher(
            new fetcher.MVVRequestFailure(new Error("socket hang up")),
        );
        const h = handlers(f);
        await call(h.svg, { path: "/svg/99999.svg", query: {} });
        await call(h.svg, { path: "/svg/99999.svg", query: {} });
        expect(f.calls).toBe(2);
    }),

    testAsync("MVV's icon is served and kept", async () => {
        const f = iconFetcher({ "010U1.svg": "<svg>U1</svg>" });
        const h = handlers(f);
        const req = { path: "/svg/010U1.svg", query: {} };
        const first = await call(h.svg, req);
        const second = await call(h.svg, req);
        expect(first.body).toBe("<svg>U1</svg>");
        expect(second.body).toBe("<svg>U1</svg>");
        expect(first.headers["Cache-Control"]).toBe("max-age=864000");
        expect(f.requested.join(" ")).toBe("010U1.svg");
    }),

    testAsync("an icon MVV has under another name is served", async () => {
        const f = iconFetcher({ "92M06.svg": "<svg>S6</svg>" });
        const h = handlers(f);
        const req = { path: "/svg/920S6.svg", query: {} };
        expect((await call(h.svg, req)).body).toBe("<svg>S6</svg>");
        expect((await call(h.svg, req)).body).toBe("<svg>S6</svg>");
        expect(f.requested.join(" ")).toBe("920S6.svg 92M06.svg");
    }),

    testAsync("a missing icon is drawn from the line", async () => {
        const f = iconFetcher({});
        const h = handlers(f);
        const req = (name: string) => ({
            path: "/svg/87RB6.svg",
            query: { name, product: "Ersatzverkehr", id: "ddb:87RB6:5" },
        });
        // RB65 and RB67 share an icon file; the label comes from the line.
        const rb65 = await call(h.svg, req("SEV RB65"));
        const rb67 = await call(h.svg, req("SEV RB67"));
        expect(rb65.headers["Content-Type"]).toBe("image/svg+xml");
        expect(rb65.headers["Cache-Control"]).toBe("max-age=86400");
        expect(String(rb65.body).includes(">RB65</text>")).toBe(true);
        expect(String(rb67.body).includes(">RB67</text>")).toBe(true);
        // MVV was asked once; the second time it was known to be missing.
        expect(f.requested.join(" ")).toBe("87RB6.svg");
    }),

    testAsync("a missing icon without its line is a 404", async () => {
        const h = handlers(iconFetcher({}));
        const res = await call(h.svg, {
            path: "/svg/20208.svg",
            query: { name: "X208" },
        });
        expect(res.statusCode).toBe(404);
    }),

    testAsync("an icon lost in transit is not drawn", async () => {
        const h = handlers(
            failingFetcher(
                new fetcher.MVVRequestFailure(new Error("503"), 503),
            ),
        );
        const res = await call(h.svg, {
            path: "/svg/20208.svg",
            query: { name: "X208", product: "ExpressBus" },
        });
        expect(res.statusCode).toBe(404);
        expect(res.body).toBe(undefined);
        expect(res.headers["Cache-Control"]).toBe("no-store");
    }),

    testAsync("MVV's answer is kept for a day", async () => {
        const f = iconFetcher({ "010U1.svg": "<svg>U1</svg>" });
        let now = 1783324800 * 1000;
        const h = handlers(f, () => now);
        const ask = (name: string) =>
            call(h.svg, { path: `/svg/${name}`, query: {} });
        await ask("010U1.svg");
        await ask("99999.svg");
        now += DAY - 1;
        await ask("010U1.svg");
        await ask("99999.svg");
        expect(f.requested.join(" ")).toBe("010U1.svg 99999.svg");
        // A day on, both are asked for again: MVV may have changed either.
        now += 1;
        expect((await ask("010U1.svg")).body).toBe("<svg>U1</svg>");
        expect((await ask("99999.svg")).statusCode).toBe(404);
        expect(f.requested.join(" ")).toBe(
            "010U1.svg 99999.svg 010U1.svg 99999.svg",
        );
    }),

    testAsync(
        "requests at the same time share one request to MVV",
        async () => {
            const f = iconFetcher({ "010U1.svg": "<svg>U1</svg>" });
            const h = handlers(f);
            const req = { path: "/svg/010U1.svg", query: {} };
            const both = await Promise.all([
                call(h.svg, req),
                call(h.svg, req),
            ]);
            expect(both[0]!.body).toBe("<svg>U1</svg>");
            expect(both[1]!.body).toBe("<svg>U1</svg>");
            expect(f.requested.length).toBe(1);
        },
    ),

    testAsync("rate limiting is not taken for a missing icon", async () => {
        const f = failingFetcher(
            new fetcher.MVVRequestFailure(new Error("Too Many Requests"), 429),
        );
        const h = handlers(f);
        const req = {
            path: "/svg/20208.svg",
            query: { name: "X208", product: "ExpressBus" },
        };
        const first = await call(h.svg, req);
        await call(h.svg, req);
        expect(first.statusCode).toBe(404);
        expect(first.body).toBe(undefined);
        expect(first.headers["Cache-Control"]).toBe("no-store");
        expect(f.calls).toBe(2);
    }),

    testAsync("names that can't be MVV's icons are not asked for", async () => {
        const f = iconFetcher({});
        const h = handlers(f);
        for (const path of [
            "/svg/U1.svg",
            "/svg/abcde.svg",
            "/svg/02019.png",
        ]) {
            expect((await call(h.svg, { path, query: {} })).statusCode).toBe(
                404,
            );
        }
        expect(f.requested.length).toBe(0);
    }),

    testAsync("MVV isn't asked once the icon budget is spent", async () => {
        const f = iconFetcher({ "010U1.svg": "<svg>U1</svg>" });
        let now = 0;
        const h = handlers(f, () => now, {
            burst: 2,
            refillMs: 1000,
            concurrent: 8,
        });
        const ask = (name: string) =>
            call(h.svg, {
                path: `/svg/${name}`,
                query: { name: "X208", product: "ExpressBus" },
            });
        // A rename is a second request: 920S6 and then 92M06.
        await ask("920S6.svg");
        expect(f.requested.join(" ")).toBe("920S6.svg 92M06.svg");
        // Spent: not asked, not drawn (MVV might have it), and not kept.
        const spent = await ask("010U1.svg");
        expect(spent.statusCode).toBe(404);
        expect(spent.body).toBe(undefined);
        expect(spent.headers["Cache-Control"]).toBe("no-store");
        expect(f.requested.length).toBe(2);
        // Answers already kept still count: 920S6 is missing, so drawn.
        const kept = await ask("920S6.svg");
        expect(String(kept.body).includes(">X208</text>")).toBe(true);
        expect(f.requested.length).toBe(2);
        // Refilled: asked again.
        now += 1000;
        expect((await ask("010U1.svg")).body).toBe("<svg>U1</svg>");
        expect(f.requested.length).toBe(3);
    }),

    testAsync("MVV is asked for a few icons at a time", async () => {
        let inFlight = 0;
        let most = 0;
        const f = {
            fetch: async (_: string): Promise<fetcher.IFetchResult> => {
                inFlight++;
                most = Math.max(most, inFlight);
                await new Promise((r) => setTimeout(r, 5));
                inFlight--;
                const body = "<svg/>";
                return { json: async () => body, text: async () => body };
            },
        };
        const h = handlers(f, Date.now, { ...ICON_LIMITS, concurrent: 3 });
        const names = Array.from({ length: 10 }, (_, i) => `1000${i}.svg`);
        const all = await Promise.all(
            names.map((n) => call(h.svg, { path: `/svg/${n}`, query: {} })),
        );
        expect(all.every((r) => r.body === "<svg/>")).toBe(true);
        expect(most).toBe(3);
    }),

    testAsync("bus 438's wrong icon is replaced", async () => {
        const f = iconFetcher({ "12438.svg": "<svg>9441</svg>" });
        const h = handlers(f);
        const res = await call(h.svg, { path: "/svg/12438.svg", query: {} });
        expect(String(res.body).includes(">438</text>")).toBe(true);
        expect(f.requested.length).toBe(0);
    }),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
