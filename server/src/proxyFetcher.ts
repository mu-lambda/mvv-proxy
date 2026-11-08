import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";
import { fetcher } from "shared";

const timeout = 3000;

function sleep(msec: number) {
    return new Promise((r) => setTimeout(r, msec));
}
export class ProxyFetcher implements fetcher.IFetcher {
    /** How many times a request is tried. */
    readonly #tries: number;
    #agent = process.env.SOCKS_PROXY
        ? new SocksProxyAgent(process.env.SOCKS_PROXY)
        : undefined;
    #reqCount = 0;

    /**
     * Server errors and lost connections are tried again, up to `tries` in
     * all.
     */
    constructor(tries = 4) {
        this.#tries = tries;
    }

    async fetch(url: string): Promise<fetcher.IFetchResult> {
        let error: any;
        let status: number | undefined;
        const reqId = this.#reqCount++;
        console.log(`${reqId}: ${url}`);
        for (let t = 0; t < this.#tries; t++) {
            try {
                const x = await fetch(url, { agent: this.#agent, timeout });
                if (x.ok) {
                    console.log(`${reqId}: success`);
                    return x;
                }
                status = x.status;
                error = new Error(
                    `MVV Fetch failed: ${x.status} ${x.statusText}`,
                );
            } catch (e) {
                status = undefined;
                error = e;
            }
            const m = error instanceof Error ? error.message : `${error}`;
            console.log(`${reqId}: try ${t}, failure: ${m}`);
            // A refusal that arrived is an answer and will be the same next
            // time; only a server error or a lost connection may go away.
            if (status !== undefined && status < 500) break;
            if (t + 1 === this.#tries) break;
            await sleep(Math.random() * 1000);
        }
        console.log(`${reqId}: failure, giving up`);
        throw new fetcher.MVVRequestFailure(error, status);
    }
}
