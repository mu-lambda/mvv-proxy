import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync(
    "near midnight requests both hours by timestamp",
    async () => {
        const { q, fetcher: f } = await newQ("midnight.json");
        await q.getDepartures(
            { stopGid: "de:09162:1", lines: ["S6-i"], timeToStop: 0 },
            new Date(1783372800 * 1000),
        );

        expect(f.requested.length).toBe(2);
        // First request: the requested time itself (23:20 Munich).
        expect(f.requested[0]!).toBe(
            "https://www.mvv-muenchen.de/?eID=departuresFinder" +
                "&action=get_departures&stop_id=de:09162:1" +
                "&requested_timestamp=1783372800" +
                "&lines=JmxpbmU9ZGRiJTNBOTJNMDYlM0ElMjAlM0FIJTNBajI1",
        );
        // Second request: next hour rounded to :00 (00:00 the next day).
        expect(f.requested[1]!).toBe(
            "https://www.mvv-muenchen.de/?eID=departuresFinder" +
                "&action=get_departures&stop_id=de:09162:1" +
                "&requested_timestamp=1783375200" +
                "&lines=JmxpbmU9ZGRiJTNBOTJNMDYlM0ElMjAlM0FIJTNBajI1",
        );
    },
);
