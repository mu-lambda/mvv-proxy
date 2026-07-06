import * as fs from "node:fs/promises";
import * as path from "node:path";
import { info, request, queryDepartures } from "shared";

import { lines } from "mvv-proxy";
import { ProxyFetcher } from "mvv-proxy";
import { data } from "mvv-proxy";

import { RecordingFetcher } from "./testingFetcher";

// Captures real MVV responses into a per-test fixtures file (one file per test,
// under tests/data/qtest/) that the //tests package replays offline via
// fetcher.FixtureFetcher.
//
//   record_departures <out.json> <stopGid> [unixSeconds|now] [lineId...]
//
// Fixtures are written to <out.json>; a ready-to-paste tests/src/<name>.test.ts
// is printed to stdout. With no lineId, Q discovers the lines (and the
// available_lines response is recorded too). The unix timestamp it queried is
// baked into the stub so the replayed request URLs match.

function usage(): never {
    console.error(
        "Usage: record_departures <out.json> <stopGid> [unixSeconds|now] [lineId...]",
    );
    process.exit(2);
}

async function main() {
    const [outArg, stopGid, tsArg, ...lineIds] = process.argv.slice(2);
    if (!outArg || !stopGid) usage();

    const timestamp =
        !tsArg || tsArg === "now" ? new Date() : new Date(+tsArg * 1000);
    if (isNaN(timestamp.getTime())) usage();

    const stopsFile = process.env.MVV_PROXY_STOPS_FILE || "./data/stops.csv";
    const stops: info.Stop[] = [];
    for await (const s of data.loadStops(stopsFile)) {
        stops.push(s);
    }

    const recorder = new RecordingFetcher(new ProxyFetcher());
    const q = new queryDepartures.Q(lines, stops, recorder);
    const req: request.SingleStop = {
        stopGid,
        lines: lineIds,
        timeToStop: 0,
    };
    const departures = await q.getDepartures(req, timestamp);

    // Resolve a relative output path against the directory `bazel run` was
    // invoked from, not the runfiles sandbox.
    const outFile = path.isAbsolute(outArg)
        ? outArg
        : path.join(
              process.env.BUILD_WORKING_DIRECTORY ?? process.cwd(),
              outArg,
          );
    await fs.writeFile(
        outFile,
        JSON.stringify(recorder.fixtures, null, 4) + "\n",
    );

    const unix = Math.floor(timestamp.getTime() / 1000);
    const testName = path.basename(outArg, ".json");
    console.error(
        `Recorded ${departures.length} departures into ` +
            `${Object.keys(recorder.fixtures).length} fixture(s): ${outFile}`,
    );
    console.error(`Queried at unix ${unix}.`);
    console.error(
        `\nWrite the snippet below to tests/src/${testName}.test.ts, then ` +
            "register it in tests/src/queryDepartures.test.ts (import its " +
            "`test` and add it to the suite() call). If " +
            `${req.stopGid} is not already in STOPS in tests/src/fixtures.ts, ` +
            "add it.\n",
    );
    // Diagnostics go to stderr, the stub to stdout, so `2>/dev/null > file`
    // captures just the test file. newQ() loads from data/qtest/, so the test
    // references the fixtures file by its basename.
    console.log(testStub(req, unix, departures, path.basename(outArg)));
}

/**
 * A ready-to-paste tests/src/<name>.test.ts file that pins the current
 * behavior: it asserts every field of every recorded departure. `stop.name` is
 * skipped because it comes from the test's synthetic STOPS, not the MVV
 * response.
 */
function testStub(
    req: request.SingleStop,
    unix: number,
    departures: info.Departure[],
    fixtureFile: string,
): string {
    const lit = (v: unknown) => JSON.stringify(v);
    const assertions = departures
        .map((d, i) => {
            const p = `departures[${i}]!`;
            return [
                `    expect(${p}.stop.gid).toBe(${lit(d.stop.gid)});`,
                `    expect(${p}.line.name).toBe(${lit(d.line.name)});`,
                `    expect(${p}.line.symbol).toBe(${lit(d.line.symbol)});`,
                `    expect(${p}.line.destination).toBe(${lit(d.line.destination)});`,
                `    expect(${p}.line.mvvApiId).toBe(${lit(d.line.mvvApiId)});`,
                `    expect(${p}.departure.date).toBe(${lit(d.departure.date)});`,
                `    expect(${p}.departure.planned).toBe(${lit(d.departure.planned)});`,
                `    expect(${p}.departure.live).toBe(${lit(d.departure.live)});`,
                `    expect(${p}.departure.inTime).toBe(${lit(d.departure.inTime)});`,
            ].join("\n");
        })
        .join("\n\n");

    // Destructure only `q` (noUnusedLocals is on); add `fetcher: f` and
    // `departuresRequests` from ./fixtures when you want to assert on requests.
    return `import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync("TODO: describe this case", async () => {
    const { q } = await newQ(${lit(fixtureFile)});
    const req: request.SingleStop = {
        stopGid: ${lit(req.stopGid)},
        lines: ${lit(req.lines)},
        timeToStop: ${req.timeToStop},
    };
    const departures = await q.getDepartures(req, new Date(${unix} * 1000));

    expect(departures.length).toBe(${departures.length});

${assertions}
});
`;
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
