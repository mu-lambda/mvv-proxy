import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync(
    "queries available_lines before get_departures",
    async () => {
        const { q, fetcher: f } = await newQ("discovery.json");
        await q.getDepartures(
            { stopGid: "de:09162:2", lines: [], timeToStop: 3 },
            new Date(1783324800 * 1000),
        );

        expect(f.requested.length).toBe(2);
        expect(f.requested[0]!).toBe(
            "https://www.mvv-muenchen.de/?eID=departuresFinder" +
                "&action=available_lines&stop_id=de:09162:2",
        );
        expect(f.requested[1]!).toBe(
            "https://www.mvv-muenchen.de/?eID=departuresFinder" +
                "&action=get_departures&stop_id=de:09162:2" +
                "&requested_timestamp=1783324980" +
                "&lines=JmxpbmU9ZGRiJTNBOTJNMDYlM0ElMjAlM0FIJTNBajI1",
        );
    },
);
