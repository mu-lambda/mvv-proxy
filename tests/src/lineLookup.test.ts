import { info, queryDepartures } from "shared";
import { lines } from "mvv-proxy";
import { testAsync, expect } from "./fixtures.ts";
import { FakeMvv } from "./testingFetcher.ts";

const STOP: info.Stop = {
    id: 1,
    name: "Test Stop 1",
    town: "Munich",
    gid: "de:09162:1",
    location: undefined,
};

// A requested line is every line MVV lists with the same name and direction,
// whatever the rest of its id says.
export const test = testAsync(
    "looks up named lines by name and direction",
    async () => {
        const mvv = new FakeMvv([
            { number: "S6", stateless: "ddb:920S6: :H:j26" },
            { number: "S6", stateless: "ddb:920S6:P:H:j26" },
            { number: "S6", stateless: "ddb:920S6: :R:j26" },
            { number: "SEV S6", stateless: "ddb:870S6:A:H:j26" },
            { number: "S8", stateless: "ddb:920S8: :H:j26" },
            { number: "S5", stateless: "ddb:920S5: :H:j26" },
        ]);
        const q = new queryDepartures.Q(lines, [STOP], mvv);
        const at = new Date(1783324800 * 1000);

        await q.getDepartures(
            { stopGid: STOP.gid, lines: ["S6-i", "SEV S6-i"], timeToStop: 0 },
            at,
        );
        expect(mvv.departureLines[0]!.join(" | ")).toBe(
            "ddb:920S6: :H:j26 | ddb:920S6:P:H:j26 | ddb:870S6:A:H:j26",
        );

        // S5-a and S5-i are two branches in the same direction: one id.
        await q.getDepartures(
            { stopGid: STOP.gid, lines: ["S5-a", "S5-i"], timeToStop: 0 },
            at,
        );
        expect(mvv.departureLines[1]!.join(" | ")).toBe("ddb:920S5: :H:j26");
    },
);
