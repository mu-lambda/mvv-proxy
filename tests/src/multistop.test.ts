import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync(
    "filters past departures and sorts across stops",
    async () => {
        const { q } = await newQ("multistop.json");
        const multi: request.MultiStop = {
            stops: [
                { stopGid: "de:09162:1", lines: ["S6-i"], timeToStop: 3 },
                { stopGid: "de:09162:2", lines: [], timeToStop: 3 },
            ],
            limit: undefined,
        };
        const departures = await q.getDeparturesForMultipleStops(
            multi,
            new Date(1783324800 * 1000),
        );

        // Stop 1 has 10:05 and 10:15, stop 2 has 10:20 -> merged and sorted.
        expect(departures.length).toBe(3);
        expect(departures[0]!.departure.planned).toBe("10:05");
        expect(departures[1]!.departure.planned).toBe("10:15");
        expect(departures[2]!.departure.planned).toBe("10:20");
    },
);
