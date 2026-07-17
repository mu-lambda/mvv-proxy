import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

// limit = 30 minutes at 10:00 -> keep departures in [10:00, 10:30]. Stop 1's
// 09:55 (past) and 10:45 (past cutoff) drop; stop 2's 10:50 drops. What's left,
// merged and sorted across both stops: 10:10 (S6), 10:20 (S3), 10:25 (S6).
export const test = testAsync(
    "limit filters departures past the cutoff across stops",
    async () => {
        const { q } = await newQ("multistopLimit.json");
        const req: request.MultiStop = {
            stops: [
                { stopGid: "de:09162:1", lines: ["S6-i"], timeToStop: 0 },
                { stopGid: "de:09162:2", lines: ["S3-i"], timeToStop: 0 },
            ],
            limit: 30,
        };
        const departures = await q.getDeparturesForMultipleStops(
            req,
            new Date(1783324800 * 1000),
        );

        expect(departures.length).toBe(3);

        expect(departures[0]!.stop.gid).toBe("de:09162:1");
        expect(departures[0]!.line.name).toBe("S6");
        expect(departures[0]!.line.symbol).toBe("S6.svg");
        expect(departures[0]!.line.destination).toBe("Ebersberg");
        expect(departures[0]!.line.mvvApiId).toBe("ddb:92M06: :H:j25");
        expect(departures[0]!.departure.date).toBe("20260706");
        expect(departures[0]!.departure.planned).toBe("10:10");
        expect(departures[0]!.departure.live).toBe(null);
        expect(departures[0]!.departure.inTime).toBe(true);

        expect(departures[1]!.stop.gid).toBe("de:09162:2");
        expect(departures[1]!.line.name).toBe("S3");
        expect(departures[1]!.line.symbol).toBe("S3.svg");
        expect(departures[1]!.line.destination).toBe("Holzkirchen");
        expect(departures[1]!.line.mvvApiId).toBe("ddb:92M03: :H:j25");
        expect(departures[1]!.departure.date).toBe("20260706");
        expect(departures[1]!.departure.planned).toBe("10:20");
        expect(departures[1]!.departure.live).toBe(null);
        expect(departures[1]!.departure.inTime).toBe(true);

        expect(departures[2]!.stop.gid).toBe("de:09162:1");
        expect(departures[2]!.line.name).toBe("S6");
        expect(departures[2]!.line.symbol).toBe("S6.svg");
        expect(departures[2]!.line.destination).toBe("Ebersberg");
        expect(departures[2]!.line.mvvApiId).toBe("ddb:92M06: :H:j25");
        expect(departures[2]!.departure.date).toBe("20260706");
        expect(departures[2]!.departure.planned).toBe("10:25");
        expect(departures[2]!.departure.live).toBe(null);
        expect(departures[2]!.departure.inTime).toBe(true);
    },
);
