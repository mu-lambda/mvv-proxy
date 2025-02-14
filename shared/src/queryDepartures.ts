import * as info from "./info";
import * as request from "./request";
import * as fetcher from "./fetcher";

type Line = info.Line;
type Stop = info.Stop;
type Departure = info.Departure;

export class Q {
    #fetcher: fetcher.IFetcher;
    #stops: Stop[];
    #stopMap = new Map<string, Stop>();
    #linesMap = new Map<string, Line>();

    constructor(lines: Line[], stops: Stop[], fetcher: fetcher.IFetcher) {
        this.#fetcher = fetcher;
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

    private buildLinesParam(s: request.SingleStop): string {
        let linesParam = "";
        for (const l of s.lines) {
            const line = this.#linesMap.get(l);
            if (line === undefined) {
                throw new Error("Bad line identifier " + l);
            }
            linesParam += "&line=" + encodeURIComponent(line.mvvApiId);
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

        const linesParam = this.buildLinesParam(s);
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
        const jsonArrays = resp.map((r) => r.departures as Array<any>);
        let jsonArray = [];
        for (const as of jsonArrays) {
            jsonArray.push(...as);
        }

        if (jsonArray === null) {
            throw new Error("Result is not an array");
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
