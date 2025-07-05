import * as d3 from "d3-quadtree";
import { info } from "shared";

import { suite, test, testAsync, expect } from "./testing";
import { distance, buildQuadtree, Locator } from "./geo";
import { loadStops } from "./data";

function ll(latitude: number, longitude: number): info.LatLong {
    return { latitude, longitude };
}
async function locator() {
    let stops = [];
    for await (const s of loadStops("data/stops.csv")) {
        stops.push(s);
    }
    return new Locator(stops);
}
function check(l: Locator, p: info.LatLong, d: number) {
    const r = new Set(l.findStops(p, d).map((s) => s.stop));
    const rCanonical = new Set(
        [...l.findStopsBruteforce(p, d)].map((s) => s.stop),
    );

    for (const sr of r) {
        expect(sr).toBeIn(rCanonical);
    }
    for (const sr of rCanonical) {
        expect(sr).toBeIn(r);
    }
    expect(r.size).toBe(rCanonical.size);
}

const tests = [
    test("First test", () => {
        let p1 = ll(48.13785428600558, 11.575292775549228);
        let p2 = ll(48.14055282565411, 11.570405018480184);
        console.log(distance(p1, p2));
        expect(distance(p1, p2)).toBeLessThanOrEqual(500);
    }),

    test("Short distance", () => {
        expect(
            distance(
                ll(48.10488975369032, 11.415461325733597),
                ll(48.1045047478348, 11.417235335753572),
            ),
        ).toBeLessThanOrEqual(150);
    }),

    test("Very short distance", () => {
        expect(
            distance(
                ll(48.12175775726744, 11.425532175642097),
                ll(48.121758285329356, 11.425549578630024),
            ),
        ).toBeLessThanOrEqual(5);
    }),

    testAsync("loading stops", async () => {
        let stops = await loadStops("data/stops-for-testing.csv");
        for await (const s of stops) {
            if (s.gid == "de:09162:10") {
                expect(s.location).toBeDefined();
                expect(s.location?.latitude).toBe(48.148832);
                expect(s.location?.longitude).toBe(11.4606435);
            }
            if (s.location) {
                expect(s.location.latitude).toNotBe(0);
                expect(s.location.longitude).toNotBe(0);
            }
        }
    }),

    testAsync("building quadtree", async () => {
        let stops = [];
        for await (const s of loadStops("data/stops-for-testing.csv")) {
            stops.push(s);
        }
        let qt = buildQuadtree(stops);
        let stopsFromQt = new Set<info.Stop>();
        qt.visit((node) => {
            if (!node.length) {
                let leaf = node as d3.QuadtreeLeaf<info.Stop>;
                do {
                    stopsFromQt.add(leaf.data);
                    if (leaf.next) {
                        leaf = leaf.next;
                    } else break;
                } while (true);
            }
            return false;
        });
        expect(stopsFromQt.size).toBe(6055);
        for (const s of stops) {
            if (s.location) {
                expect(s).toBeIn(stopsFromQt);
            } else {
                expect(s).toNotBeIn(stopsFromQt);
            }
        }
    }),

    testAsync("locator", async () => {
        const l = await locator();
        const p = ll(48.15742651774988, 11.543407524524575);
        const d = 500;
        check(l, p, d);
    }),

    testAsync("locator2", async () => {
        const l = await locator();
        const r = l.findStops(ll(48.15742651774988, 11.543407524524575), 1);
        expect(r.length).toBe(0);
    }),

    testAsync("locator3", async () => {
        const l = await locator();
        const r = l.findStops(
            ll(48.15742651774988, 11.543407524524575),
            1000 * 1000,
        );
        expect(r.length).toBe(l.numberOfStopsWithLocations());
    }),
    testAsync("locator4", async () => {
        const l = await locator();
        const p = { latitude: 47.587345379999995, longitude: 11.311201147 };
        const d = 1000;
        check(l, p, d);
    }),

    testAsync("everyTenthsStop", async () => {
        const l = await locator();
        let n = 0;
        for (const s of l.stopsWithLocations()) {
            if (!s.location) continue;
            if (n++ % 10 != 0) continue;
            const p = {
                latitude: s.location.latitude + 0.001,
                longitude: s.location.longitude + 0.001,
            };
            check(l, p, 500);
        }
    }),
];

const exhaustiveTest = (
    name: string,
    distance: number,
    npoints: number,
    reportProgress: boolean,
) =>
    testAsync(name, async () => {
        let stops = [];
        for await (const s of loadStops("data/stops-for-testing.csv")) {
            if (!s.location) continue;
            stops.push(s);
        }
        const l = new Locator(stops);
        const latitude = (s: info.Stop) =>
            s.location ? s.location.latitude : NaN;
        const longitude = (s: info.Stop) =>
            s.location ? s.location.longitude : NaN;
        let minLatitude = stops.reduce(
            (min, s) => (min < latitude(s) ? min : latitude(s)),
            +Infinity,
        );
        let minLongitude = stops.reduce(
            (min, s) => (min < longitude(s) ? min : longitude(s)),
            +Infinity,
        );
        let maxLatitude = stops.reduce(
            (max, s) => (max > latitude(s) ? max : latitude(s)),
            -Infinity,
        );
        let maxLongitude = stops.reduce(
            (max, s) => (max > longitude(s) ? max : longitude(s)),
            -Infinity,
        );

        const latitudeStep = (maxLatitude - minLatitude) / npoints;
        const longitudeStep = (maxLongitude - minLongitude) / npoints;

        const totalWork = npoints * npoints;
        if (reportProgress) {
            console.log(`Testing ${totalWork} locations`);
        }

        let count = 0;
        let reportedPercentage = Infinity;

        for (let i = 0; i < npoints; i++) {
            for (let j = 0; j < npoints; j++) {
                const p = ll(
                    minLatitude + i * latitudeStep,
                    minLongitude + j * longitudeStep,
                );
                check(l, p, distance);
                if (reportProgress) {
                    const np = Math.floor((++count / totalWork) * 100);
                    if (np !== reportedPercentage) {
                        reportedPercentage = np;
                        process.stdout.write(`\r${reportedPercentage}% `);
                    }
                }
            }
        }
        if (reportProgress) {
            console.log(" Done");
        }
    });

const benchmarkTest = (distance: number, npoints: number) =>
    testAsync("benchmark", async () => {
        let stops = [];
        for await (const s of loadStops("data/stops.csv")) {
            if (!s.location) continue;
            stops.push(s);
        }
        const l = new Locator(stops);
        const latitude = (s: info.Stop) =>
            s.location ? s.location.latitude : NaN;
        const longitude = (s: info.Stop) =>
            s.location ? s.location.longitude : NaN;
        let minLatitude = stops.reduce(
            (min, s) => (min < latitude(s) ? min : latitude(s)),
            +Infinity,
        );
        let minLongitude = stops.reduce(
            (min, s) => (min < longitude(s) ? min : longitude(s)),
            +Infinity,
        );
        let maxLatitude = stops.reduce(
            (max, s) => (max > latitude(s) ? max : latitude(s)),
            -Infinity,
        );
        let maxLongitude = stops.reduce(
            (max, s) => (max > longitude(s) ? max : longitude(s)),
            -Infinity,
        );

        const margin = 0.1; // degrees
        const latitudeStep = (maxLatitude - minLatitude + margin * 2) / npoints;
        const longitudeStep =
            (maxLongitude - minLongitude + margin * 2) / npoints;

        const start = Date.now();
        for (let i = 0; i < npoints; i++) {
            for (let j = 0; j < npoints; j++) {
                const p = ll(
                    minLatitude - margin + i * latitudeStep,
                    minLongitude - margin + j * longitudeStep,
                );

                l.findStops(p, distance);
            }
        }
        const delta = Date.now() - start;
        const nRequests = npoints * npoints;
        console.log(
            `${nRequests} requests (distance ${distance} m) calculated in ${delta} msec (${nRequests / delta} req/msec)`,
        );
    });

const exhaustiveFlag = "--exhaustive";
const stressFlag = "--stress";
const benchmarkFlag = "--benchmark";
async function testing() {
    const success = await suite(...tests);

    if (!success) process.exitCode = 1;
    if (process.argv.includes(exhaustiveFlag)) {
        if (!(await suite(exhaustiveTest("exhaustive", 1000, 100, false)))) {
            process.exitCode = 1;
        }
    } else {
        console.log(
            `Exhaustive test not run, pass ${exhaustiveFlag} to npm test`,
        );
    }
    if (process.argv.includes(stressFlag)) {
        if (
            !(await suite(
                exhaustiveTest("stress", 500, 1000, true),
                exhaustiveTest("extra-stress", 100, 2000, true),
            ))
        ) {
            process.exitCode = 1;
        }
    } else {
        console.log(`Stress test not run, pass ${stressFlag} to npm test`);
    }

    if (process.argv.includes(benchmarkFlag)) {
        if (!(await suite(benchmarkTest(1000, 1000)))) {
            process.exitCode = 1;
        }
    } else {
        console.log(`Benchmark not run, pass ${benchmarkFlag} to npm test`);
    }
}

testing();
