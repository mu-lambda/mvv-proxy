import { request } from "shared";
import { testAsync, expect, newQ, departuresRequests } from "./fixtures";

export const test = testAsync(
    "makes a second request near midnight and dedupes",
    async () => {
        const { q, fetcher: f } = await newQ("midnight.json");
        const req: request.SingleStop = {
            stopGid: "de:09162:1",
            lines: ["S6-i"],
            timeToStop: 0,
        };
        // 2026-07-06 23:20 Munich falls in the 23:00 hour, so Q fires a second
        // request for the following hour.
        const departures = await q.getDepartures(
            req,
            new Date(1783372800 * 1000),
        );

        expect(departuresRequests(f).length).toBe(2);
        // 4 raw departures across the two responses, one is a duplicate.
        expect(departures.length).toBe(3);
        expect(departures[0]!.departure.planned).toBe("23:25");
        expect(departures[1]!.departure.planned).toBe("00:05");
        expect(departures[2]!.departure.planned).toBe("00:20");
    },
);
