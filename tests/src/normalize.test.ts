import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync(
    "normalizes departures for a single stop",
    async () => {
        const { q } = await newQ("normal.json");
        const req: request.SingleStop = {
            stopGid: "de:09162:1",
            lines: ["S6-i"],
            timeToStop: 3,
        };
        // 2026-07-06 10:00 Munich; +3min => requested_timestamp 1783324980.
        const departures = await q.getDepartures(
            req,
            new Date(1783324800 * 1000),
        );

        expect(departures.length).toBe(2);
        expect(departures[0]!.stop.name).toBe("Test Stop 1");
        expect(departures[0]!.line.name).toBe("S6");
        expect(departures[0]!.line.destination).toBe("Ebersberg");
        expect(departures[0]!.line.mvvApiId).toBe("ddb:92M06: :H:j25");
        expect(departures[0]!.departure.planned).toBe("10:05");
        // "10:06" live time is preserved.
        expect(departures[0]!.departure.live).toBe("10:06");
        // Empty live string is normalized to null.
        expect(departures[1]!.departure.live).toBe(null);
    },
);
