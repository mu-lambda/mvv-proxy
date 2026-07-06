import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync(
    "discovers lines when none are requested",
    async () => {
        const { q, fetcher: f } = await newQ("discovery.json");
        const req: request.SingleStop = {
            stopGid: "de:09162:2",
            lines: [], // triggers the available_lines lookup
            timeToStop: 3,
        };
        const departures = await q.getDepartures(
            req,
            new Date(1783324800 * 1000),
        );

        // available_lines was queried before get_departures.
        expect(
            f.requested.some((u) => u.includes("action=available_lines")),
        ).toBe(true);
        expect(departures.length).toBe(1);
        expect(departures[0]!.departure.planned).toBe("10:20");
    },
);
