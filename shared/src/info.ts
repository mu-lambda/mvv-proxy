/** Represents an MVV line. Data reverse-engineered from MVV "api" */
export type Line = {
    /** normal id. Line designator + direction.
     * Examples: S6-a (auswarts), S6-i (inwarts), 265-n (nord), 265-s (süd).
     *
     */
    id: string;
    /**
     * Readable line name, same in both directions. Matches the `number` MVV
     * lists for the line.
     */
    name: string;

    /** Representative destination */
    destination: string;

    /**
     * MVV's direction for the line: the H or R in its line ids. Q looks the
     * id itself up from MVV when querying, because the rest of it changes.
     *
     * The ids are EFA line ids (MVV's journey planner runs on EFA):
     *
     *     ddb:920S6: :H:j26
     *     operator : line code : variant : direction : timetable period
     *
     * - operator: ddb (DB, the S-Bahn), swm (MVG: city U-Bahn, tram, bus),
     *   mvv (regional buses).
     * - line code: can change, even within a timetable year (S6 went from
     *   92M06 to 920S6 in 2026).
     * - variant: blank, or a letter such as P, A, E or G for a branch or
     *   special service.
     * - direction: H (Hinrichtung, outbound) or R (Rückrichtung, return).
     * - timetable period: j26 (DB's 2026 annual timetable), s26 (regional
     *   buses), 016 (MVG). Changes every December.
     *
     * Which end is H is set per line in MVV's planning data, not derived from
     * geography; MVV documents no rule. Observed in 2025 and 2026:
     * - S-Bahn: H runs east (Ebersberg, Holzkirchen, Trudering, Flughafen,
     *   Kreuzstraße), R west (Pasing, Mammendorf, Geltendorf, Tutzing). This
     *   fits H following the line's own numbering, but that is a guess.
     * - Buses follow no common pattern: 56 runs H to Fürstenried West, X208
     *   H to Germering, while 260, 266 and 962 run R westwards.
     * - H and R stayed the same from the 2025 timetable to 2026 for every line
     *   checked, while the period and sometimes the line code changed. A line
     *   that is redefined (merged, split, extended) could still flip.
     * - A line can have several branches in one direction: S5-a and S5-i are
     *   both H (Kreuzstraße and Höhenkirchen-Siegertsbrunn).
     */
    direction: "H" | "R";
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

export type StopWithDistance = {
    stop: Stop;
    distance: number; // meters
};

/**
 * Where at a stop a vehicle departs from, normalized from MVV's mode-specific
 * `track` field. Three kinds:
 * - `Gleis`: an S-Bahn / train platform — a bare track number
 *   (raw MVV e.g. "1", "36").
 * - `UBahnGleis`: a U-Bahn platform — MVV writes these with the word "Gleis"
 *   (raw MVV e.g. "U-Bahn Gleis 1", "U1/7 Gleis 3").
 * - `Steig`: a street-level boarding point — Trams and Buses
 *   (raw MVV e.g. "Bstg. 2" (Bussteig), "Pos. 6" (tram position)).
 *
 * `designation` is the number extracted from the raw string. When no number can
 * be extracted the departure point is omitted entirely (shown as nothing).
 */
export type DeparturePoint = {
    kind: "Gleis" | "UBahnGleis" | "Steig";
    designation: number;
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
        /**
         * MVV's product, e.g. "Bus", "ExpressBus", "SEV". The server draws
         * an icon from it when MVV has none.
         */
        product: string;
    };

    departure: {
        /** YYYYMMDD format */
        date: string;
        /** HH:MM format */
        planned: string;
        live: string | null;
        inTime: boolean;
    };

    /** Where the vehicle departs from, or undefined if MVV gave no usable value. */
    departurePoint: DeparturePoint | undefined;
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
