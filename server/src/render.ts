import { info, stringCache, request } from "shared";
type Departure = info.Departure;
type LatLong = info.LatLong;
type StringCache = stringCache.StringCache;

const closeDepartureGap = 4; // min

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

    renderSymbolTag(d: Departure): string {
        const textOnError =
            d.line.name.length <= 5
                ? d.line.name
                : `${d.line.name.substring(0, 3)}...`;
        if (d.line.symbol !== null) {
            // Temproary hack for 208 Express Bus.
            const s =
                d.line.symbol === "20208.svg" ? "19208.svg" : d.line.symbol;
            if (!s.endsWith(".svg")) {
                return textOnError;
            }
            return `<img src="/svg/${s}" 
                class="line-icon" 
                onerror="this.replaceWith('${textOnError}')"
                alt="${d.line.name}" />`;
        } else {
            return textOnError;
        }
    }

    renderDeparture(d: Departure): string {
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
        return `
            <tr class="departure-row">
            <td class="line-icon-column">${this.renderSymbolTag(d)}</td>
            <td class="line-name">${this.stringCache.destinationRender(d.line.destination)}</td>
            <td class="stop-name">${this.renderStop(d)}</td>
            <td class="departure-time"><div class="time ${timeClass} ${lateClass}">${time}</div></td>
            </tr>\
`;
    }

    renderStop(d: Departure): string {
        return this.stringCache.destinationRender(d.stop.name);
    }

    renderTable(departures: Iterable<Departure>): string {
        let tableRows = "";
        for (const d of departures) {
            tableRows += this.renderDeparture(d);
        }
        return `\
            <table class="departure-table">
        <tbody>
        ${tableRows}
        </tbody>
        </table>`;
    }

    renderHeader(_: Date): string {
        return "";
    }

    public render(departures: Iterable<Departure>): string {
        return `\
        <!DOCTYPE html>
        <html>
        <head>
        <link rel="stylesheet" href="index.css"\>
        </head>
        <body>
        ${this.renderHeader(this.#date)}
        ${this.renderTable(departures)}
        </body>
        </html>`;
    }
}

export class GeoRenderer extends Renderer {
    #distances: Map<string, info.StopWithDistance>;
    #location: LatLong;

    constructor(
        stringCache: StringCache,
        date: Date,
        location: LatLong,
        request: request.MultiStop,
        distances: info.StopWithDistance[],
    ) {
        super(stringCache, date, request);
        this.#distances = new Map();
        this.#location = location;
        for (const d of distances) {
            this.#distances.set(d.stop.gid, d);
        }
    }

    override renderHeader(date: Date): string {
        const h = date.getHours();
        const m =
            date.getMinutes() < 10
                ? "0" + date.getMinutes()
                : date.getMinutes().toString();

        return `\
            <div class="departures-header">
                <div>
                    MVV Departures around <a href="${this.stringCache.locationUrl(this.#location)}" target="_blank">you</a>
                    at ${h}:${m}
                </div>
                <span class="disclaimer">Not an official service of MVV
                    <a href="https://www.paypal.com/donate?hosted_button_id=SVH3NYCAR3UAN" target="_blank">
                        <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif"/>
                    </a>
                </span>
            </div>`;
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

    public override render(ds: Iterable<Departure>): string {
        return super.render(this.filterDeparturesWithClosestStops(ds));
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
