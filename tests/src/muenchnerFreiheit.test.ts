import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures.ts";

// At Münchner Freiheit MVV writes the U-Bahn's platforms as just "Gleis 1" to
// "Gleis 4", without the "U-Bahn" or "U3/6" other stations put in front. They
// are still U-Bahn platforms, with round signs.
export const test = testAsync(
    "recorded: Münchner Freiheit's plain Gleis N are U-Bahn platforms",
    async () => {
        const { q } = await newQ("muenchnerFreiheit.json");
        const req: request.SingleStop = {
            stopGid: "de:09162:500",
            lines: [],
            timeToStop: 0,
        };
        const departures = await q.getDepartures(
            req,
            new Date(1794695941 * 1000),
        );

        expect(departures.length).toBe(54);
        const ubahn = departures.filter((d) => d.line.product === "U-Bahn");
        expect(ubahn.length).toBe(28);
        for (const d of departures) {
            expect(d.departurePoint?.kind).toBe(
                d.line.product === "U-Bahn" ? "UBahnGleis" : "Steig",
            );
        }
        // U3 stops at Gleis 3 and 4, U6 at Gleis 1 and 2.
        const platforms = new Set(
            ubahn.map((d) => `${d.line.name} ${d.departurePoint?.designation}`),
        );
        expect([...platforms].sort().join(", ")).toBe("U3 3, U3 4, U6 1, U6 2");

        expect(departures[0]!.line.name).toBe("U3");
        expect(departures[0]!.departurePoint?.kind).toBe("UBahnGleis");
        expect(departures[0]!.departurePoint?.designation).toBe(3);
        expect(departures[2]!.line.product).toBe("MetroBus");
        expect(departures[2]!.departurePoint?.kind).toBe("Steig");
        expect(departures[2]!.departurePoint?.designation).toBe(5);
    },
);
