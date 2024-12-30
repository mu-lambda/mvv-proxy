import { type Stop, type LatLong } from "./info";

class LatLongCache {
    #map: Map<number, Map<number, string>>;
    #f: (p: LatLong) => string;

    constructor(f: (p: LatLong) => string) {
        this.#map = new Map<number, Map<number, string>>();
        this.#f = f;
    }

    get = (p: LatLong): string => {
        let longitudeMap = this.#map.get(p.latitude);
        if (!longitudeMap) {
            longitudeMap = new Map<number, string>();
            this.#map.set(p.latitude, longitudeMap);
        }
        const result = longitudeMap.get(p.latitude);
        if (result) return result;
        const newValue = this.#f(p);
        longitudeMap.set(p.longitude, newValue);
        return newValue;
    };
}

class Cache<Key, Value> {
    #map: Map<Key, Value>;
    #f: (key: Key) => Value;

    constructor(f: (key: Key) => Value) {
        this.#map = new Map<Key, Value>();
        this.#f = f;
    }

    get = (k: Key) => {
        const v = this.#map.get(k);
        if (v) return v;
        const newV = this.#f(k);
        this.#map.set(k, newV);
        return newV;
    };
}

export class StringCache {
    #directionsCache = new LatLongCache(
        (p) =>
            `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${p.latitude},${p.longitude}`,
    );
    #locationCache = new LatLongCache((p: LatLong): string => {
        const query = encodeURIComponent(`${p.latitude},${p.longitude}`);
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    });

    #stopRender = new Cache<string, string>((s) => {
        s = s.replace(
            /(\s+)?\(S\)/g,
            `&thinsp;<img src="/S-Bahn-Logo.svg" class="bahn-logo"></img>`,
        );
        s = s.replace(
            /(\s+)?\(U\)/g,
            `&thinsp;<img src="/U-Bahn.svg" class="bahn-logo"></img>`,
        );
        return s;
    });
    directionsUrl = (s: Stop): string | null => {
        if (s.location) {
            return this.#directionsCache.get(s.location);
        } else {
            return null;
        }
    };

    locationUrl = this.#locationCache.get;

    destinationRender = this.#stopRender.get;
}
