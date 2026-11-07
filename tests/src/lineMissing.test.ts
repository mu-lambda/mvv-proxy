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

// A requested line MVV doesn't list at the stop is skipped, and logged once
// rather than on every refresh.
export const test = testAsync(
    "skips and logs a named line MVV doesn't list",
    async () => {
        const mvv = new FakeMvv([
            { number: "S6", stateless: "ddb:920S6: :H:j26" },
        ]);
        const q = new queryDepartures.Q(lines, [STOP], mvv);
        const at = new Date(1783324800 * 1000);

        const logged: string[] = [];
        const consoleError = console.error;
        console.error = (...args: unknown[]) => logged.push(args.join(" "));
        try {
            for (let i = 0; i < 2; i++) {
                await q.getDepartures(
                    {
                        stopGid: STOP.gid,
                        lines: ["S6-i", "S3-i"],
                        timeToStop: 0,
                    },
                    at,
                );
            }
            // Nothing left to ask for: no departures request at all.
            const none = await q.getDepartures(
                { stopGid: STOP.gid, lines: ["S3-i"], timeToStop: 0 },
                at,
            );
            expect(none.length).toBe(0);
        } finally {
            console.error = consoleError;
        }

        expect(mvv.departureLines.length).toBe(2);
        expect(mvv.departureLines[0]!.join(" | ")).toBe("ddb:920S6: :H:j26");
        expect(mvv.departureLines[1]!.join(" | ")).toBe("ddb:920S6: :H:j26");
        expect(logged.length).toBe(1);
        expect(logged[0]!).toBe(
            "MVV lists no S3 (H) at stop de:09162:1; skipping line S3-i",
        );
    },
);
