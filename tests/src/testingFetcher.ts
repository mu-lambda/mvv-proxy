import { fetcher } from "shared";

type IFetcher = fetcher.IFetcher;
type IFetchResult = fetcher.IFetchResult;

/**
 * A recorded set of MVV responses, keyed by {@link fixtureKey}. Values are the
 * decoded JSON bodies. Produced by {@link RecordingFetcher} (see the
 * `record_departures` tool) and consumed by {@link FixtureFetcher} in tests.
 */
export type Fixtures = Record<string, unknown>;

/**
 * Canonical, human-readable key for an MVV `departuresFinder` request. Keys on
 * the fields a test author actually cares about (action + stop + requested
 * time) rather than the raw URL, which embeds a base64 `line=` blob. Recording
 * and replay share this function so they always agree.
 */
export function fixtureKey(url: string): string {
    const params = new URL(url).searchParams;
    const action = params.get("action");
    if (!action) {
        // Not a departuresFinder request (e.g. an SVG fetch): key on the URL.
        return url;
    }
    const stop = params.get("stop_id") ?? "";
    const timestamp = params.get("requested_timestamp");
    return timestamp ? `${action}|${stop}|${timestamp}` : `${action}|${stop}`;
}

/** Serves canned {@link Fixtures} offline, for hermetic tests. */
export class FixtureFetcher implements IFetcher {
    /** URLs requested so far, in order. Handy for asserting call counts. */
    readonly requested: string[] = [];

    constructor(private readonly fixtures: Fixtures) {}

    async fetch(url: string): Promise<IFetchResult> {
        this.requested.push(url);
        const key = fixtureKey(url);
        if (!(key in this.fixtures)) {
            throw new Error(`No fixture for "${key}" (${url})`);
        }
        const body = this.fixtures[key];
        return {
            json: async () => body,
            text: async () =>
                typeof body === "string" ? body : JSON.stringify(body),
        };
    }
}

/**
 * Wraps a real {@link IFetcher} and captures each JSON response into
 * {@link fixtures}, ready to be written out and replayed by
 * {@link FixtureFetcher}. JSON-only: intended for recording departure data.
 */
export class RecordingFetcher implements IFetcher {
    readonly fixtures: Fixtures = {};

    constructor(private readonly inner: IFetcher) {}

    async fetch(url: string): Promise<IFetchResult> {
        const body = await (await this.inner.fetch(url)).json();
        this.fixtures[fixtureKey(url)] = body;
        return {
            json: async () => body,
            text: async () => JSON.stringify(body),
        };
    }
}

/** A line as a fake MVV lists it for a stop. */
export type FakeLine = { number: string; stateless: string };

/**
 * A stand-in for MVV: lists the given lines for every stop, answers
 * departures with none, and records which lines each departures request
 * asked for. Set {@link failLineLists} to make line lists fail.
 */
export class FakeMvv implements IFetcher {
    lineListRequests = 0;
    failLineLists = false;
    /** The MVV line ids each get_departures request asked for, in order. */
    readonly departureLines: string[][] = [];

    constructor(private readonly lines: FakeLine[]) {}

    async fetch(url: string): Promise<IFetchResult> {
        const params = new URL(url).searchParams;
        let body: unknown;
        if (params.get("action") === "available_lines") {
            this.lineListRequests++;
            if (this.failLineLists) {
                throw new fetcher.MVVRequestFailure("MVV is down", 503);
            }
            body = { lines: this.lines };
        } else {
            const decoded = atob(params.get("lines") ?? "");
            this.departureLines.push(
                decoded
                    .split("&line=")
                    .slice(1)
                    .map((l) => decodeURIComponent(l)),
            );
            body = { departures: [] };
        }
        return {
            json: async () => body,
            text: async () => JSON.stringify(body),
        };
    }
}
