import React, { ReactElement } from "react";

import { info, stringCache, request } from "shared";
type Departure = info.Departure;
type StringCache = stringCache.StringCache;

const closeDepartureGap = 4; // min

function svgIconOnError(textOnError: string): React.ReactEventHandler {
    return (e) => {
        e.currentTarget.replaceWith(textOnError);
    };
}

export class Renderer {
    protected stringCache: StringCache;
    #date: Date;
    #request: request.MultiStop;
    #timesToStop: Map<string, number>;

    constructor(
        stringCache: StringCache,
        date: Date,
        request: request.MultiStop,
    ) {
        this.stringCache = stringCache;
        this.#date = date;
        this.#request = request;
        this.#timesToStop = new Map<string, number>();
        for (const s of this.#request.stops) {
            this.#timesToStop.set(s.stopGid, s.timeToStop);
        }
    }

    isCloseDeparture(d: Departure): boolean {
        let diff =
            (info.dateForDeparture(d).getTime() - this.#date.getTime()) / 60000;
        let timeToStop = this.#timesToStop.get(d.stop.gid);
        if (timeToStop === undefined) {
            return false;
        }
        return diff < timeToStop + closeDepartureGap;
    }

    protected svgUrl(filename: string): string {
        return `/svg/${filename}`;
    }

    renderSymbolTag(d: Departure): ReactElement {
        const textOnError =
            d.line.name.length <= 5
                ? d.line.name
                : `${d.line.name.substring(0, 3)}...`;
        if (d.line.symbol !== null) {
            // Temproary hack for 208 Express Bus.
            const s =
                d.line.symbol === "20208.svg" ? "19208.svg" : d.line.symbol;
            if (!s.endsWith(".svg")) {
                return <span>{textOnError}</span>;
            }
            const src = this.svgUrl(s);
            return (
                <img
                    src={src}
                    className="line-icon"
                    onError={svgIconOnError(textOnError)}
                    alt={d.line.name}
                ></img>
            );
        } else {
            return <span>{textOnError}</span>;
        }
    }

    renderDeparture(d: Departure): ReactElement {
        const [time, isLive] =
            d.departure.live != null
                ? [d.departure.live, true]
                : [d.departure.planned, false];
        const timeClass = isLive
            ? d.departure.inTime
                ? "time-normal"
                : "time-late"
            : "time-planned";
        const lateClass = this.isCloseDeparture(d) ? "time-close" : "";
        const className = `time ${timeClass} ${lateClass}`;
        return (
            <tr className="departure-row">
                <td className="line-icon-column">{this.renderSymbolTag(d)}</td>
                <td
                    className="line-name"
                    dangerouslySetInnerHTML={{
                        __html: this.stringCache.destinationRender(
                            d.line.destination,
                        ),
                    }}
                ></td>
                <td
                    className="stop-name"
                    dangerouslySetInnerHTML={{ __html: this.renderStop(d) }}
                ></td>
                <td className="departure-time">
                    <div className={className}>{time}</div>
                </td>
            </tr>
        );
    }

    renderStop(d: Departure): string {
        return this.stringCache.destinationRender(d.stop.name);
    }

    renderTable(departures: Iterable<Departure>): ReactElement {
        let tableRows = [];
        for (const d of departures) {
            tableRows.push(this.renderDeparture(d));
        }
        return (
            <table className="departure-table">
                <tbody>{tableRows}</tbody>
            </table>
        );
    }
}

export class GeoRenderer extends Renderer {
    #distances: Map<string, info.StopWithDistance>;

    constructor(
        stringCache: StringCache,
        date: Date,
        request: request.MultiStop,
        distances: info.StopWithDistance[],
    ) {
        super(stringCache, date, request);
        this.#distances = new Map();
        for (const d of distances) {
            this.#distances.set(d.stop.gid, d);
        }
    }

    override renderStop(d: Departure) {
        const stopWithDistance = this.#distances.get(d.stop.gid);
        if (stopWithDistance) {
            const distanceRoundedTo10m =
                Math.floor(stopWithDistance.distance / 10) * 10;
            const distanceString = `(${distanceRoundedTo10m}m)`;
            const url = this.stringCache.directionsUrl(stopWithDistance.stop);

            if (url == null) return `${super.renderStop(d)} ${distanceString}`;
            else
                return `<a href="${url}" target="_blank">${super.renderStop(d)}</a> ${distanceString}`;
        } else {
            return d.stop.name;
        }
    }

    public override renderTable(ds: Iterable<Departure>): ReactElement {
        return super.renderTable(this.filterDeparturesWithClosestStops(ds));
    }

    protected override svgUrl(filename: string): string {
        return `https://www.mvv-muenchen.de/fileadmin/lines/${filename}`;
    }

    public *filterDeparturesWithClosestStops(
        ds: Iterable<Departure>,
    ): Iterable<Departure> {
        const lineToClosestStop = new Map<string, string>();
        for (const d of ds) {
            const lineId = d.line.mvvApiId;
            const stopId = d.stop.gid;
            const prevStopId = lineToClosestStop.get(lineId);
            if (prevStopId) {
                if (prevStopId !== stopId) {
                    const prevS = this.#distances.get(prevStopId);
                    const newS = this.#distances.get(stopId);
                    if (prevS && newS && newS.distance < prevS.distance) {
                        lineToClosestStop.set(lineId, stopId);
                    }
                }
            } else {
                lineToClosestStop.set(lineId, stopId);
            }
        }

        for (const d of ds) {
            if (d.stop.gid === lineToClosestStop.get(d.line.mvvApiId)) yield d;
        }
    }
}
