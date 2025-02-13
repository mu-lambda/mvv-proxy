import * as d3 from "d3-quadtree";
import { info } from "shared";

function rad(x: number) {
    return (x * Math.PI) / 180;
}
const R = 6378137; // Earth’s mean radius in meter
export function longitudalDistance(
    latitude1: number,
    latitude2: number,
): number {
    const dLat = rad(latitude2 - latitude1);
    return R * Math.abs(dLat);
}

export function latitudalDistance(
    latitude: number,
    longitude1: number,
    longitude2: number,
): number {
    const dLong = rad(longitude2 - longitude1);
    const a = Math.cos(rad(latitude)) ** 2 * Math.sin(dLong / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d; // returns the distance in meter
}

export function distance(p1: info.LatLong, p2: info.LatLong): number {
    // Use Pythagorean distance as an approximation.
    const longitudal = longitudalDistance(p1.latitude, p2.latitude);
    const latitudal = latitudalDistance(
        p1.latitude,
        p1.longitude,
        p2.longitude,
    );
    return Math.sqrt(longitudal ** 2 + latitudal ** 2);
}

export function buildQuadtree(
    stops: Iterable<info.Stop>,
): d3.Quadtree<info.Stop> {
    const result: d3.Quadtree<info.Stop> = d3.quadtree();
    result.x((s: info.Stop) => (s.location ? s.location.latitude : 0));
    result.y((s: info.Stop) => (s.location ? s.location.longitude : 0));
    for (const s of stops) {
        if (s.location) {
            result.add(s);
        }
    }
    return result;
}

export type StopWithDistance = {
    stop: info.Stop;
    distance: number; // meters
};

export class Locator {
    #qt: d3.Quadtree<info.Stop>;
    #stops: Iterable<info.Stop>;

    constructor(stops: Iterable<info.Stop>) {
        this.#qt = buildQuadtree(stops);
        this.#stops = stops;
    }

    numberOfStopsWithLocations() {
        return this.#qt.size();
    }

    stopsWithLocations(): Iterable<info.Stop> {
        return this.#qt.data();
    }

    *findStopsBruteforce(
        p: info.LatLong,
        maxDistance: number,
    ): Iterable<StopWithDistance> {
        for (const stop of this.#stops) {
            if (!stop.location) continue;
            const d = distance(p, stop.location);
            if (d <= maxDistance) {
                yield { stop, distance: d };
            }
        }
    }

    findStops(
        p: info.LatLong,
        maxDistance: number,
        e?: info.LatLong,
    ): StopWithDistance[] {
        const result: StopWithDistance[] = [];
        let visited = 0;

        this.#qt.visit((node, lat1, long1, lat2, long2): boolean => {
            if (!node.length) {
                let leaf = node as d3.QuadtreeLeaf<info.Stop>;
                do {
                    const stop = leaf.data;
                    if (stop.location) {
                        visited++;
                        const d = distance(p, stop.location);
                        if (d <= maxDistance) {
                            result.push({ stop, distance: d });
                        }
                    }
                    if (leaf.next) leaf = leaf.next;
                    else break;
                } while (true);
                return true;
            } else {
                let shouldNotSkip = false;
                if (e) {
                    shouldNotSkip =
                        lat1 <= e.latitude &&
                        e.latitude <= lat2 &&
                        long1 <= e.longitude &&
                        e.longitude <= long2;
                }
                const inside =
                    lat1 <= p.latitude &&
                    p.latitude <= lat2 &&
                    long1 <= p.longitude &&
                    p.longitude <= long2;
                let skip = !inside;
                let d1 = NaN,
                    d2 = NaN,
                    d3 = NaN,
                    d4 = NaN;
                if (skip) {
                    d1 = longitudalDistance(p.latitude, lat1);
                    d2 = latitudalDistance(p.latitude, p.longitude, long1);
                    d3 = longitudalDistance(p.latitude, lat2);
                    d4 = latitudalDistance(p.latitude, p.longitude, long2);
                    skip =
                        d1 > maxDistance &&
                        d2 > maxDistance &&
                        d3 > maxDistance &&
                        d4 > maxDistance;
                }
                if (e && skip && shouldNotSkip) {
                    console.log(
                        `Looking for: ${JSON.stringify(e)} ${distance(p, e)}`,
                    );
                    console.log(
                        `Error: ${inside} ${skip} Internal ${lat1} ${long1} ${lat2} ${long2}`,
                    );
                    console.log(`Distances: ${d1} ${d2} ${d3} ${d4}`);
                }
                return skip;
            }
        });
        return result;
    }
}
