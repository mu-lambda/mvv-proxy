import * as fs from "node:fs/promises";
import { info, queryDepartures, testing } from "shared";
import { lines } from "mvv-proxy";
import { Fixtures, FixtureFetcher } from "./testingFetcher";

// The test harness, re-exported so each *.test.ts imports it from one place.
export const testAsync = testing.testAsync;
export const expect = testing.expect;

// Real line definitions (from shared) with synthetic stops: the tests exercise
// the production line table but don't depend on the real stops.csv. The gids
// below match the fixture keys in data/qtest/*.json.
const STOPS: info.Stop[] = [
    {
        id: 1,
        name: "Test Stop 1",
        town: "Munich",
        gid: "de:09162:1",
        location: undefined,
    },
    {
        id: 2,
        name: "Test Stop 2",
        town: "Munich",
        gid: "de:09162:2",
        location: undefined,
    },
    {
        id: 6,
        name: "Munich Hbf (no trains)",
        town: "Munich",
        gid: "de:09162:6",
        location: undefined,
    },
    {
        id: 100,
        name: "Munich Hbf (trains)",
        town: "Munich",
        gid: "de:09162:100",
        location: undefined,
    },
    {
        id: 2600,
        name: "Planegg",
        town: "Planegg",
        gid: "de:09184:2600",
        location: undefined,
    },
];

// One fixtures file per test, under data/qtest/. chdir is the tests package
// (see BUILD.bazel). New files are produced by //server:record_departures.
export async function loadFixtures(file: string): Promise<Fixtures> {
    const raw = await fs.readFile(`data/qtest/${file}`, {
        encoding: "utf-8",
    });
    return JSON.parse(raw) as Fixtures;
}

export async function newQ(file: string): Promise<{
    q: queryDepartures.Q;
    fetcher: FixtureFetcher;
}> {
    const f = new FixtureFetcher(await loadFixtures(file));
    return { q: new queryDepartures.Q(lines, STOPS, f), fetcher: f };
}

export function departuresRequests(f: FixtureFetcher): string[] {
    return f.requested.filter((u) => u.includes("action=get_departures"));
}
