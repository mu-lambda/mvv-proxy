import * as http from "node:http";
import type { AddressInfo } from "node:net";
import { fetcher, testing as harness } from "shared";

import { ProxyFetcher } from "./proxyFetcher.ts";

const { suite, testAsync, expect } = harness;

/** Answers /<status> with that status, counting requests per path. */
async function withMvv(
    body: (url: string, hits: Map<string, number>) => Promise<void>,
): Promise<void> {
    const hits = new Map<string, number>();
    const server = http.createServer((req, res) => {
        const p = req.url ?? "/";
        hits.set(p, (hits.get(p) ?? 0) + 1);
        res.statusCode = Number(p.slice(1)) || 500;
        res.end("{}");
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const { port } = server.address() as AddressInfo;
    try {
        await body(`http://127.0.0.1:${port}`, hits);
    } finally {
        server.closeAllConnections();
        server.close();
    }
}

async function failure(p: Promise<unknown>): Promise<unknown> {
    try {
        await p;
    } catch (e) {
        return e;
    }
    throw new Error("expected a failure");
}

const tests = [
    testAsync("a reply is returned", () =>
        withMvv(async (url, hits) => {
            await new ProxyFetcher().fetch(`${url}/200`);
            expect(hits.get("/200")).toBe(1);
        }),
    ),

    // A refusal that arrived is an answer, and will be the same next time.
    testAsync("a 4xx is not retried", () =>
        withMvv(async (url, hits) => {
            const e = await failure(new ProxyFetcher().fetch(`${url}/404`));
            expect(e instanceof fetcher.MVVRequestFailure).toBe(true);
            expect((e as fetcher.MVVRequestFailure).status).toBe(404);
            expect(hits.get("/404")).toBe(1);
        }),
    ),

    testAsync("a 5xx is retried", () =>
        withMvv(async (url, hits) => {
            const e = await failure(new ProxyFetcher().fetch(`${url}/503`));
            expect((e as fetcher.MVVRequestFailure).status).toBe(503);
            expect(hits.get("/503")).toBe(4);
        }),
    ),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
