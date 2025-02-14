import * as info from "./info";
export type SingleStop = {
    /** Stop global identifier */
    stopGid: string;
    /** Lines requested. should come from lines.lines ids. */
    lines: string[];
    /** Time to get to the stop, in minutes */
    timeToStop: number;
};

export type MultiStop = {
    stops: SingleStop[];
    /** Limit in minutes */
    limit: number | undefined;
};

export type TimetableResponse = {
    date: number;
    request: MultiStop;
    departures: info.Departure[];
};
