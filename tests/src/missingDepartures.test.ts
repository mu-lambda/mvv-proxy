import { info, queryDepartures, type fetcher } from "shared";
import { lines } from "mvv-proxy";
import { testAsync, expect } from "./fixtures.ts";

const STOP: info.Stop = {
    id: 1,
    name: "Test Stop 1",
    town: "Munich",
    gid: "de:09162:1",
    location: undefined,
};

/** Answers every request with a JSON object that has no departures. */
const emptyReplies: fetcher.IFetcher = {
    fetch: async () => ({ json: async () => ({}), text: async () => "{}" }),
};

export const test = testAsync(
    "a reply without departures says so",
    async () => {
        const q = new queryDepartures.Q(lines, [STOP], emptyReplies);
        let message = "";
        try {
            await q.getDepartures(
                { stopGid: STOP.gid, lines: ["S6-i"], timeToStop: 0 },
                new Date(1783324800 * 1000),
            );
        } catch (e) {
            message = (e as Error).message;
        }
        expect(message).toBe("MVV reply has no departures");
    },
);
