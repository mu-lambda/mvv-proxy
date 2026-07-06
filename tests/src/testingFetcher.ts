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
