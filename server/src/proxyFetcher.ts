import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";
import { fetcher } from "shared";

const timeout = 3000;
const retries = 4;

function sleep(msec: number) {
    return new Promise((r) => setTimeout(r, msec));
}
export class ProxyFetcher implements fetcher.IFetcher {
    #agent = process.env.SOCKS_PROXY
        ? new SocksProxyAgent(process.env.SOCKS_PROXY)
        : undefined;
    #reqCount = 0;

    async fetch(url: string): Promise<fetcher.IFetchResult> {
        let error: any;
        const reqId = this.#reqCount++;
        console.log(`${reqId}: ${url}`);
        for (let t = 0; t < retries; t++) {
            try {
                const x = await fetch(url, { agent: this.#agent, timeout });
                if (!x.ok) {
                    throw new Error(
                        `MVV Fetch failed: ${x.status} ${x.statusText}`,
                    );
                }
                console.log(`${reqId}: success`);
                return x;
            } catch (e) {
                const m = e instanceof Error ? e.message : `${e}`;
                console.log(`${reqId}: try ${t}, failure: ${m}`);
                error = e;
            }
            await sleep(Math.random() * 1000);
        }
        console.log(`${reqId}: failure, giving up`);
        throw new fetcher.MVVRequestFailure(error);
    }
}
