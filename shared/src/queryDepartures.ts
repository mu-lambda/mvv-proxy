import * as info from "./info.ts";
import * as request from "./request.ts";
import * as fetcher from "./fetcher.ts";

type Line = info.Line;
type Stop = info.Stop;
type Departure = info.Departure;

/**
 * Parses MVV's raw `track` string into a DeparturePoint. The designation is the
 * last number in the string; the kind is read from the string's own vocabulary
 * (see departurePointKind). Returns undefined when there is no number (e.g.
 * plain bus stops, whose `track` is empty).
 */
function parseDeparturePoint(
    track: string | undefined,
): info.DeparturePoint | undefined {
    if (track === undefined) {
        return undefined;
    }
    const designation = lastNumber(track);
    if (designation === undefined) {
        return undefined;
    }
    return { kind: departurePointKind(track), designation };
}

function departurePointKind(track: string): "Gleis" | "UBahnGleis" | "Steig" {
    // Trams report "Pos. N" (position) and buses "Bstg. N" (Bussteig): a Steig.
    if (/steig|bstg|pos/i.test(track)) {
        return "Steig";
    }
    // U-Bahn platforms are written as a "U" line/label followed by the word
    // "Gleis" ("U-Bahn Gleis 1", "U1/7 Gleis 3"). A plain "Gleis N" or a bare
    // number ("1", "36") is an S-Bahn/train Gleis.
    if (/u.*gleis/i.test(track)) {
        return "UBahnGleis";
    }
    return "Gleis";
}

/** The last run of digits in `s` as a number, or undefined if there is none. */
function lastNumber(s: string): number | undefined {
    const matches = s.match(/\d+/g);
    if (matches === null) {
        return undefined;
    }
    const last = matches[matches.length - 1];
    return last === undefined ? undefined : Number(last);
}

/** A line as MVV's available_lines lists it for a stop. */
type AvailableLine = {
    /** The line's name, as in Line.name ("S6", "X208", "SEV S6"). */
    number?: string;
    /** MVV's id for the line, e.g. "ddb:920S6: :H:j26". */
    stateless: string;
};

/** The H or R in an MVV line id such as "ddb:920S6: :H:j26". */
function directionOf(stateless: string): string | undefined {
    return stateless.split(":")[3];
}

/** How long a stop's line list from MVV is reused. */
const AVAILABLE_LINES_TTL_MS = 24 * 60 * 60 * 1000;

type AvailableLinesEntry = {
    fetchedAt: number;
    lines: Promise<AvailableLine[]>;
    /** Requested lines already logged as missing, so each is logged once. */
    reportedMissing: Set<string>;
};

export class Q {
    #fetcher: fetcher.IFetcher;
    #now: () => number;
    #stops: Stop[];
    #stopMap = new Map<string, Stop>();
    #linesMap = new Map<string, Line>();
    #availableLines = new Map<string, AvailableLinesEntry>();

    /** `now` gives the time in milliseconds; tests replace it. */
    constructor(
        lines: Line[],
        stops: Stop[],
        fetcher: fetcher.IFetcher,
        now: () => number = Date.now,
    ) {
        this.#fetcher = fetcher;
        this.#now = now;
        this.#stops = stops;
        for (const s of this.#stops) {
            this.#stopMap.set(s.gid, s);
        }
        for (const l of lines) {
            this.#linesMap.set(l.id, l);
        }
    }

    stops = () => this.#stops;

    private validateSingleStopRequest(s: request.SingleStop, errors: string[]) {
        if (this.#stops.findIndex((stop) => stop.gid === s.stopGid) < 0) {
            errors.push(`Unknown stop: ${s.stopGid}`);
        }
        for (const l of s.lines) {
            if (!this.#linesMap.has(l)) {
                errors.push(`Line ${l} is not known for stop ${s.stopGid}`);
            }
        }
    }

    public validateRequestReturningErrors(r: request.MultiStop): string[] {
        const result: string[] = [];
        for (const s of r.stops) {
            this.validateSingleStopRequest(s, result);
        }
        return result;
    }

    /**
     * The lines MVV lists for a stop, fetched at most once a day. A failed
     * fetch is not kept, so the next query asks again.
     */
    private availableLines(stopGid: string): AvailableLinesEntry {
        const now = this.#now();
        const cached = this.#availableLines.get(stopGid);
        if (cached && now - cached.fetchedAt < AVAILABLE_LINES_TTL_MS) {
            return cached;
        }
        const entry: AvailableLinesEntry = {
            fetchedAt: now,
            lines: this.fetchAvailableLines(stopGid),
            reportedMissing: new Set(),
        };
        this.#availableLines.set(stopGid, entry);
        entry.lines.catch(() => {
            if (this.#availableLines.get(stopGid) === entry) {
                this.#availableLines.delete(stopGid);
            }
        });
        return entry;
    }

    private async fetchAvailableLines(
        stopGid: string,
    ): Promise<AvailableLine[]> {
        const url = `https://www.mvv-muenchen.de/?eID=departuresFinder&action=available_lines&stop_id=${stopGid}`;
        const result = await this.fetchJson(url);
        if (!Array.isArray(result?.lines)) {
            throw new Error(`MVV reply has no lines for stop ${stopGid}`);
        }
        return result.lines;
    }

    /**
     * MVV ids for the requested lines: every line MVV lists for the stop with
     * the same name and direction. A requested line MVV doesn't list is
     * skipped, and logged once per stop list. No lines requested means all of
     * them.
     */
    private async lineIds(s: request.SingleStop): Promise<string[]> {
        const entry = this.availableLines(s.stopGid);
        const available = await entry.lines;
        if (s.lines.length === 0) {
            return available.map((l) => l.stateless);
        }
        const ids = new Set<string>();
        for (const id of s.lines) {
            const line = this.#linesMap.get(id);
            if (line === undefined) {
                throw new Error("Bad line identifier " + id);
            }
            const matches = available.filter(
                (a) =>
                    a.number === line.name &&
                    directionOf(a.stateless) === line.direction,
            );
            if (matches.length === 0 && !entry.reportedMissing.has(id)) {
                entry.reportedMissing.add(id);
                console.error(
                    `MVV lists no ${line.name} (${line.direction}) at stop ` +
                        `${s.stopGid}; skipping line ${id}`,
                );
            }
            for (const m of matches) {
                ids.add(m.stateless);
            }
        }
        return [...ids];
    }

    private async buildLinesParam(s: request.SingleStop): Promise<string> {
        let linesParam = "";
        const lineIds = await this.lineIds(s);
        for (const l of lineIds) {
            linesParam += "&line=" + encodeURIComponent(l);
        }
        linesParam += "";
        return btoa(linesParam);
    }

    private mvvTimestamp(d: Date): string {
        return Math.floor(d.getTime() / 1000).toString();
    }

    private dedupe<T>(input: T[]): T[] {
        // Terrible hack.
        const visited = new Set<string>();
        return input.filter((x) => {
            const s = JSON.stringify(x);
            if (!visited.has(s)) {
                visited.add(s);
                return true;
            }
            return false;
        });
    }

    private async fetchJson(url: string): Promise<any> {
        return (await this.#fetcher.fetch(url)).json();
    }

    private getUrl(params: URLSearchParams): string {
        let result =
            "https://www.mvv-muenchen.de/?eID=departuresFinder&action=get_departures";
        for (const [k, v] of params.entries()) {
            result += `&${k}=${v}`;
        }
        return result;
    }

    public async getDepartures(
        s: request.SingleStop,
        timestamp: Date,
    ): Promise<Departure[]> {
        const stop = this.#stopMap.get(s.stopGid);
        if (stop === undefined) {
            throw new Error(`Unknown stop ${s.stopGid}`);
        }

        const timestampInTheFuture = new Date(
            timestamp.getTime() + s.timeToStop * 60000,
        );

        const linesParam = await this.buildLinesParam(s);
        if (linesParam === "") {
            return [];
        }
        let params = [];
        params.push({
            stop_id: s.stopGid,
            requested_timestamp: this.mvvTimestamp(timestampInTheFuture),
            lines: linesParam,
        });

        // MVV API limitation: if we are close to midnght, ask for next day departures too.
        if (timestampInTheFuture.getHours() == 23) {
            let anotherTimestamp = new Date(
                timestampInTheFuture.getTime() + 60 * 60 * 1000,
            );
            anotherTimestamp.setMinutes(0);
            params.push({
                stop_id: s.stopGid,
                requested_timestamp: this.mvvTimestamp(anotherTimestamp),
                lines: linesParam,
            });
        }

        const resp = await Promise.all(
            params.map((p) =>
                this.fetchJson(this.getUrl(new URLSearchParams(p))),
            ),
        );
        let jsonArray: any[] = [];
        for (const r of resp) {
            if (!Array.isArray(r.departures)) {
                throw new Error("MVV reply has no departures");
            }
            jsonArray.push(...r.departures);
        }
        if (params.length > 1) {
            jsonArray = this.dedupe(jsonArray);
        }
        const result: Departure[] = [];
        for (const obj of jsonArray) {
            const d: Departure = {
                stop: {
                    name: stop.name,
                    gid: s.stopGid,
                },
                line: {
                    name: obj.line?.number,
                    symbol: obj.line?.symbol,
                    destination: obj.line?.direction,
                    mvvApiId: obj.line?.stateless,
                    product: obj.line?.name ?? "",
                },
                departure: {
                    date: obj.departureDate,
                    planned: obj.departurePlanned,
                    live:
                        (obj.departureLive as string) === ""
                            ? null
                            : obj.departureLive,
                    inTime: obj.inTime,
                },
                departurePoint: parseDeparturePoint(obj.track),
            };
            result.push(d);
        }
        return result;
    }

    public async getDeparturesForMultipleStops(
        r: request.MultiStop,
        timestamp: Date,
    ): Promise<Departure[]> {
        const allDepartures: Departure[][] = await Promise.all(
            r.stops.map((s) => this.getDepartures(s, timestamp)),
        );
        let filter: (d: Departure) => boolean;
        if (r.limit) {
            const cutoff = new Date(timestamp.getTime() + r.limit * 60 * 1000);
            filter = (d) => {
                const t = info.dateForDeparture(d);
                return t >= timestamp && t <= cutoff;
            };
        } else {
            filter = (d) => info.dateForDeparture(d) >= timestamp;
        }
        let mergedDepartures: Departure[] = [];
        for (const ad of allDepartures) {
            mergedDepartures.push(...ad);
        }
        mergedDepartures = mergedDepartures
            .filter(filter)
            .sort((departure1, departure2) => {
                const d1 = info.dateForDeparture(departure1);
                const d2 = info.dateForDeparture(departure2);
                if (d1 < d2) return -1;
                else if (d1 > d2) return 1;
                else if (departure1.line.name < departure2.line.name) return -1;
                else if (departure1.line.name > departure2.line.name) return 1;
                else return 0;
            });
        return mergedDepartures;
    }
}
