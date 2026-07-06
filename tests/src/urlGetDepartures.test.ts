import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync(
    "builds the get_departures URL with base64 lines",
    async () => {
        const { q, fetcher: f } = await newQ("normal.json");
        await q.getDepartures(
            { stopGid: "de:09162:1", lines: ["S6-i"], timeToStop: 3 },
            new Date(1783324800 * 1000),
        );

        // requested_timestamp = base + timeToStop*60 (unix seconds); lines is
        // btoa("&line=" + encodeURIComponent("ddb:92M06: :H:j25")).
        expect(f.requested.length).toBe(1);
        expect(f.requested[0]!).toBe(
            "https://www.mvv-muenchen.de/?eID=departuresFinder" +
                "&action=get_departures&stop_id=de:09162:1" +
                "&requested_timestamp=1783324980" +
                "&lines=JmxpbmU9ZGRiJTNBOTJNMDYlM0ElMjAlM0FIJTNBajI1",
        );
    },
);
