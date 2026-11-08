import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures.ts";

// The nearby page ticks off each stop as its departures come in, so every
// stop must be reported, by its index in the request, before the merged
// result is ready.
export const test = testAsync("reports each stop as it is done", async () => {
    const { q } = await newQ("multistop.json");
    const multi: request.MultiStop = {
        stops: [
            { stopGid: "de:09162:1", lines: ["S6-i"], timeToStop: 3 },
            { stopGid: "de:09162:2", lines: [], timeToStop: 3 },
        ],
        limit: undefined,
    };
    const done: number[] = [];
    let resolved = false;
    const result = q
        .getDeparturesForMultipleStops(
            multi,
            new Date(1783324800 * 1000),
            (i) => {
                expect(resolved).toBe(false);
                done.push(i);
            },
        )
        .then((departures) => {
            resolved = true;
            return departures;
        });
    const departures = await result;

    expect(done.length).toBe(2);
    expect(new Set(done).size).toBe(2);
    expect(done.includes(0)).toBe(true);
    expect(done.includes(1)).toBe(true);
    expect(departures.length).toBe(3);
});
