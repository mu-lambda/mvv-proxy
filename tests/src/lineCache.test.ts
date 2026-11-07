import { info, queryDepartures } from "shared";
import { lines } from "mvv-proxy";
import { testAsync, expect } from "./fixtures.ts";
import { FakeMvv } from "./testingFetcher.ts";

const STOP: info.Stop = {
    id: 1,
    name: "Test Stop 1",
    town: "Munich",
    gid: "de:09162:1",
    location: undefined,
};

const DAY = 24 * 60 * 60 * 1000;

// A stop's line list is fetched once a day, and a failed fetch is retried on
// the next query rather than kept.
export const test = testAsync(
    "fetches a stop's lines once a day, and retries failures",
    async () => {
        const mvv = new FakeMvv([
            { number: "S6", stateless: "ddb:920S6: :H:j26" },
        ]);
        let now = 1783324800 * 1000;
        const q = new queryDepartures.Q(lines, [STOP], mvv, () => now);
        const query = (stopLines: string[]) =>
            q.getDepartures(
                { stopGid: STOP.gid, lines: stopLines, timeToStop: 0 },
                new Date(now),
            );

        mvv.failLineLists = true;
        let message = "";
        try {
            await query(["S6-i"]);
        } catch (e) {
            message = (e as Error).message;
        }
        expect(message).toBe("MVV is down");
        expect(mvv.lineListRequests).toBe(1);

        mvv.failLineLists = false;
        await query(["S6-i"]);
        expect(mvv.lineListRequests).toBe(2);

        // Named lines and all lines share the stop's list.
        now += DAY - 1;
        await query(["S6-i"]);
        await query([]);
        expect(mvv.lineListRequests).toBe(2);

        now += 1;
        await query(["S6-i"]);
        expect(mvv.lineListRequests).toBe(3);
        expect(mvv.departureLines.length).toBe(4);
    },
);
