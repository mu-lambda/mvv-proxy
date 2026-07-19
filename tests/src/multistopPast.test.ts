import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

// No limit at 10:00 -> drop only past departures (stop 1's 09:50, stop 2's
// 09:30). Both stops have a 10:15; at equal times the sort tiebreaks on line
// name, so S3 (stop 2) comes before S6 (stop 1). Then stop 1's 11:00.
export const test = testAsync(
    "drops past departures and tiebreaks equal times by line name",
    async () => {
        const { q } = await newQ("multistopPast.json");
        const req: request.MultiStop = {
            stops: [
                { stopGid: "de:09162:1", lines: ["S6-i"], timeToStop: 0 },
                { stopGid: "de:09162:2", lines: ["S3-i"], timeToStop: 0 },
            ],
            limit: undefined,
        };
        const departures = await q.getDeparturesForMultipleStops(
            req,
            new Date(1783324800 * 1000),
        );

        expect(departures.length).toBe(3);

        expect(departures[0]!.stop.gid).toBe("de:09162:2");
        expect(departures[0]!.line.name).toBe("S3");
        expect(departures[0]!.line.symbol).toBe("S3.svg");
        expect(departures[0]!.line.destination).toBe("Holzkirchen");
        expect(departures[0]!.line.mvvApiId).toBe("ddb:92M03: :H:j25");
        expect(departures[0]!.departure.date).toBe("20260706");
        expect(departures[0]!.departure.planned).toBe("10:15");
        expect(departures[0]!.departure.live).toBe(null);
        expect(departures[0]!.departure.inTime).toBe(true);
        expect(departures[0]!.departurePoint).toBe(undefined);

        expect(departures[1]!.stop.gid).toBe("de:09162:1");
        expect(departures[1]!.line.name).toBe("S6");
        expect(departures[1]!.line.symbol).toBe("S6.svg");
        expect(departures[1]!.line.destination).toBe("Ebersberg");
        expect(departures[1]!.line.mvvApiId).toBe("ddb:92M06: :H:j25");
        expect(departures[1]!.departure.date).toBe("20260706");
        expect(departures[1]!.departure.planned).toBe("10:15");
        expect(departures[1]!.departure.live).toBe(null);
        expect(departures[1]!.departure.inTime).toBe(true);
        expect(departures[1]!.departurePoint).toBe(undefined);

        expect(departures[2]!.stop.gid).toBe("de:09162:1");
        expect(departures[2]!.line.name).toBe("S6");
        expect(departures[2]!.line.symbol).toBe("S6.svg");
        expect(departures[2]!.line.destination).toBe("Ebersberg");
        expect(departures[2]!.line.mvvApiId).toBe("ddb:92M06: :H:j25");
        expect(departures[2]!.departure.date).toBe("20260706");
        expect(departures[2]!.departure.planned).toBe("11:00");
        expect(departures[2]!.departure.live).toBe(null);
        expect(departures[2]!.departure.inTime).toBe(true);
        expect(departures[2]!.departurePoint).toBe(undefined);
    },
);
