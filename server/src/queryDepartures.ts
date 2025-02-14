import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";
import { info, request } from "shared";

type Line = info.Line;
type Stop = info.Stop;
type Departure = info.Departure;
import { lines } from "./lines";

function sleep(msec: number) {
    return new Promise((r) => setTimeout(r, msec));
}

const timeout = 3000;
const retries = 4;
export class MVVRequestFailure extends Error {
    constructor(e: any) {
        const m = e instanceof Error ? (e as Error).message : `${e}`;
        super(m);
    }
}

const agent = new SocksProxyAgent(process.env.SOCKS_PROXY || "");

export class Q {
    #a: AxiosInstance;
    #stops: Stop[];
    #stopMap: Map<string, Stop>;
    #reqCount = 0;

    constructor(stops: Stop[]) {
        this.#a = axios.create({
            baseURL:
                "https://www.mvv-muenchen.de/?eID=departuresFinder&action=get_departures",
            timeout,
        });
        this.#stops = stops;
        this.#stopMap = new Map<string, Stop>();
        for (const s of this.#stops) {
            this.#stopMap.set(s.gid, s);
        }
    }

    stops = () => this.#stops;

    private validateSingleStopRequest(s: request.SingleStop, errors: string[]) {
        if (this.#stops.findIndex((stop) => stop.gid === s.stopGid) < 0) {
            errors.push(`Unknown stop: ${s.stopGid}`);
        }
        for (const l of s.lines) {
            if (!Q.#linesMap.has(l)) {
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
            const line = Q.#linesMap.get(l);
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

    private async request(c: axios.AxiosRequestConfig): Promise<any> {
        let error: any;
        const reqId = this.#reqCount++;
        const url = this.#a.getUri(c);
        console.log(`${reqId}: ${url}`);
        for (let t = 0; t < retries; t++) {
            try {
                const x = await fetch(url, { agent, timeout });
                console.log(`${reqId}: success`);
                return await x.json();
            } catch (e) {
                const m = e instanceof Error ? e.message : `${e}`;
                console.log(`${reqId}: try ${t}, failure: ${m}`);
                error = e;
            }
            await sleep(Math.random() * 100);
        }
        console.log(`${reqId}: failure, giving up`);
        throw new MVVRequestFailure(error);
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

        const configs: AxiosRequestConfig[] = params.map((p) => {
            return {
                params: new URLSearchParams(p),
            };
        });
        const resp = await Promise.all(configs.map((c) => this.request(c)));
        const jsonArrays = resp.map((r) => r.departures as Array<any>);
        let jsonArray = jsonArrays.flat();

        if (jsonArray === null) {
            throw new Error("Result is not an array");
        }
        if (configs.length > 1) {
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
        const mergedDepartures: Departure[] = allDepartures
            .flat()
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

    static #linesMap = new Map<string, Line>();

    static {
        for (const l of lines) {
            this.#linesMap.set(l.id, l);
        }
    }
}
