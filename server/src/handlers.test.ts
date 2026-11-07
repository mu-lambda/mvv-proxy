import type * as express from "express";
import { fetcher, queryDepartures, testing as harness } from "shared";

import { Handlers } from "./handlers.ts";

const { suite, testAsync, expect } = harness;

type FakeResponse = {
    statusCode: number;
    body: unknown;
    status(code: number): FakeResponse;
    sendStatus(code: number): FakeResponse;
    send(body: unknown): FakeResponse;
    setHeader(name: string, value: string): FakeResponse;
};

function fakeResponse(): FakeResponse {
    const r: FakeResponse = {
        statusCode: 200,
        body: undefined,
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
        setHeader: () => r,
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

function handlers(f: fetcher.IFetcher): Handlers {
    return new Handlers(new queryDepartures.Q([], [], f), f, undefined);
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

    testAsync("an icon MVV does not have is asked for once", async () => {
        const f = failingFetcher(
            new fetcher.MVVRequestFailure(new Error("Not Found"), 404),
        );
        const h = handlers(f);
        const first = await call(h.svg, { path: "/svg/U1.svg" });
        const second = await call(h.svg, { path: "/svg/U1.svg" });
        expect(first.statusCode).toBe(404);
        expect(second.statusCode).toBe(404);
        expect(f.calls).toBe(1);
    }),

    testAsync("an icon that failed in transit is asked for again", async () => {
        const f = failingFetcher(
            new fetcher.MVVRequestFailure(new Error("socket hang up")),
        );
        const h = handlers(f);
        await call(h.svg, { path: "/svg/U1.svg" });
        await call(h.svg, { path: "/svg/U1.svg" });
        expect(f.calls).toBe(2);
    }),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
