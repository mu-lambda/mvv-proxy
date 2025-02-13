/** Represents an MVV line. Data reverse-engineered from MVV "api" */
export type Line = {
    /** normal id. Line designator + direction.
     * Examples: S6-a (auswarts), S6-i (inwarts), 265-n (nord), 265-s (süd).
     *
     */
    id: string;
    /**
     * Readable line name, same in both directions.
     */
    name: string;

    /** Representative destination */
    destination: string;

    /** MVV API id, reengineered */
    mvvApiId: string;
};

export type LatLong = {
    latitude: number;
    longitude: number;
};

export type Stop = {
    id: number;
    name: string;
    town: string;
    gid: string;
    location: LatLong | undefined;
};
export type Departure = {
    stop: {
        name: string;
        gid: string;
    };

    line: {
        /** Display name */
        name: string;
        /** SVG file with a symbol */
        symbol: string | null;
        /** Destination */
        destination: string;
        /** Id (as in lines.lines)*/
        mvvApiId: string;
    };

    departure: {
        /** YYYYMMDD format */
        date: string;
        /** HH:MM format */
        planned: string;
        live: string | null;
        inTime: boolean;
    };
};

/** Returns a date that can be used to compare departures */
export function dateForDeparture(d: Departure): Date {
    try {
        const year = +d.departure.date.substring(0, 4);
        const month = +d.departure.date.substring(4, 6);
        const day = +d.departure.date.substring(6);
        const timeStrings = (
            d.departure.live === null ? d.departure.planned : d.departure.live
        ).split(":");
        if (timeStrings.length != 2) {
            return new Date(1970, 0, 1);
        }
        const hour: number = +timeStrings[0]!;
        const minute: number = +timeStrings[1]!;
        if (isNaN(hour) || isNaN(minute)) {
            return new Date(1970, 0, 1);
        }
        return new Date(year, month - 1, day, hour, minute);
    } catch (e) {
        console.log("Failed to parse " + d.toString());
        return new Date(1970, 0, 1);
    }
}
