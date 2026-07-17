import * as fs from "node:fs/promises";
import * as path from "node:path";
import { info, request, queryDepartures } from "shared";

import { lines } from "mvv-proxy";
import { ProxyFetcher } from "mvv-proxy";
import { data } from "mvv-proxy";

import { RecordingFetcher } from "./testingFetcher";

// Captures real MVV responses into a per-test fixtures file (one file per test,
// under tests/data/qtest/) that the //tests package replays offline via
// FixtureFetcher. Fixtures are written to <out.json>; a ready-to-paste
// tests/src/<name>.test.ts is printed to stdout (diagnostics go to stderr, so
// `2>/dev/null > file` captures just the test).
//
// Single stop (getDepartures):
//   record_departures <out.json> <stopGid> [unixSeconds|now] [lineId...]
//
// Multiple stops (getDeparturesForMultipleStops), triggered by --stop:
//   record_departures <out.json> [--at unixSeconds|now] [--limit minutes] \
//       --stop <gid>[=<line,line,...>] [--stop ...]
//
// gid and its lines are separated by '=' (not ':', since gids contain colons).
// With no lines, Q discovers them (the available_lines response is recorded
// too). The unix timestamp queried is baked into the stub so replayed request
// URLs match.

function usage(): never {
    console.error(
        "Usage:\n" +
            "  record_departures <out.json> <stopGid> [unixSeconds|now] [lineId...]\n" +
            "  record_departures <out.json> [--at unixSeconds|now] [--limit minutes] \\\n" +
            "      --stop <gid>[=<line,line,...>] [--stop ...]",
    );
    process.exit(2);
}

async function main() {
    const args = process.argv.slice(2);
    const outArg = args[0];
    if (!outArg) usage();

    if (args.includes("--stop")) {
        await recordMulti(outArg, args.slice(1));
    } else {
        await recordSingle(outArg, args.slice(1));
    }
}

/** Records one stop and emits a `getDepartures` (SingleStop) test. */
async function recordSingle(outArg: string, rest: string[]) {
    const [stopGid, tsArg, ...lineIds] = rest;
    if (!stopGid) usage();
    const timestamp = parseTimestamp(tsArg);

    const recorder = new RecordingFetcher(new ProxyFetcher());
    const q = new queryDepartures.Q(lines, await loadStops(), recorder);
    const req: request.SingleStop = { stopGid, lines: lineIds, timeToStop: 0 };
    const departures = await q.getDepartures(req, timestamp);

    await writeFixtures(outArg, recorder);
    const unix = Math.floor(timestamp.getTime() / 1000);
    report(outArg, recorder, departures, unix, [stopGid]);
    console.log(singleStopStub(req, unix, departures, path.basename(outArg)));
}

/** Records several stops and emits a `getDeparturesForMultipleStops` test. */
async function recordMulti(outArg: string, rest: string[]) {
    let tsArg: string | undefined;
    let limit: number | undefined;
    const stops: request.SingleStop[] = [];
    for (let i = 0; i < rest.length; i++) {
        const a = rest[i];
        if (a === "--at") {
            tsArg = rest[++i];
        } else if (a === "--limit") {
            const v = rest[++i];
            if (v === undefined) usage();
            limit = Number(v);
            if (isNaN(limit)) usage();
        } else if (a === "--stop") {
            const spec = rest[++i];
            if (spec === undefined) usage();
            const eq = spec.indexOf("=");
            const gid = eq < 0 ? spec : spec.slice(0, eq);
            const lineStr = eq < 0 ? "" : spec.slice(eq + 1);
            const lineIds = lineStr === "" ? [] : lineStr.split(",");
            stops.push({ stopGid: gid, lines: lineIds, timeToStop: 0 });
        } else {
            usage();
        }
    }
    if (stops.length === 0) usage();
    const timestamp = parseTimestamp(tsArg);

    const recorder = new RecordingFetcher(new ProxyFetcher());
    const q = new queryDepartures.Q(lines, await loadStops(), recorder);
    const req: request.MultiStop = { stops, limit };
    const departures = await q.getDeparturesForMultipleStops(req, timestamp);

    await writeFixtures(outArg, recorder);
    const unix = Math.floor(timestamp.getTime() / 1000);
    report(
        outArg,
        recorder,
        departures,
        unix,
        stops.map((s) => s.stopGid),
    );
    console.log(multiStopStub(req, unix, departures, path.basename(outArg)));
}

function parseTimestamp(tsArg: string | undefined): Date {
    const t =
        !tsArg || tsArg === "now" ? new Date() : new Date(Number(tsArg) * 1000);
    if (isNaN(t.getTime())) usage();
    return t;
}

async function loadStops(): Promise<info.Stop[]> {
    const stopsFile = process.env.MVV_PROXY_STOPS_FILE || "./data/stops.csv";
    const stops: info.Stop[] = [];
    for await (const s of data.loadStops(stopsFile)) {
        stops.push(s);
    }
    return stops;
}

/** Writes the recorded fixtures next to the directory `bazel run` was run from. */
async function writeFixtures(outArg: string, recorder: RecordingFetcher) {
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
}

function report(
    outArg: string,
    recorder: RecordingFetcher,
    departures: info.Departure[],
    unix: number,
    gids: string[],
) {
    const testName = path.basename(outArg, ".json");
    console.error(
        `Recorded ${departures.length} departures into ` +
            `${Object.keys(recorder.fixtures).length} fixture(s).`,
    );
    console.error(`Queried at unix ${unix}.`);
    console.error(
        `\nWrite the snippet below to tests/src/${testName}.test.ts, then ` +
            "register it in tests/src/queryDepartures.test.ts (import its " +
            "`test` and add it to the suite() call). Ensure each stop below is " +
            `in STOPS in tests/src/fixtures.ts: ${gids.join(", ")}.\n`,
    );
}

/**
 * The 9-field-per-departure assertion block shared by both stubs. `stop.name`
 * is skipped because it comes from the test's synthetic STOPS, not the MVV
 * response; every other field pins the current normalization behavior.
 */
function fieldAssertions(departures: info.Departure[]): string {
    const lit = (v: unknown) => JSON.stringify(v);
    return departures
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
}

/** A ready-to-paste single-stop test that pins the current behavior. */
function singleStopStub(
    req: request.SingleStop,
    unix: number,
    departures: info.Departure[],
    fixtureFile: string,
): string {
    const lit = (v: unknown) => JSON.stringify(v);
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

${fieldAssertions(departures)}
});
`;
}

/** A ready-to-paste multi-stop test that pins the merged/filtered/sorted output. */
function multiStopStub(
    req: request.MultiStop,
    unix: number,
    departures: info.Departure[],
    fixtureFile: string,
): string {
    const lit = (v: unknown) => JSON.stringify(v);
    const stopLines = req.stops
        .map(
            (s) =>
                `            { stopGid: ${lit(s.stopGid)}, lines: ${lit(s.lines)}, timeToStop: ${s.timeToStop} },`,
        )
        .join("\n");
    return `import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync("TODO: describe this case", async () => {
    const { q } = await newQ(${lit(fixtureFile)});
    const req: request.MultiStop = {
        stops: [
${stopLines}
        ],
        limit: ${req.limit === undefined ? "undefined" : req.limit},
    };
    const departures = await q.getDeparturesForMultipleStops(
        req,
        new Date(${unix} * 1000),
    );

    expect(departures.length).toBe(${departures.length});

${fieldAssertions(departures)}
});
`;
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
