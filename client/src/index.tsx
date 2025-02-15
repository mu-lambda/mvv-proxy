import React, { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { stringCache, request, info, queryDepartures, fetcher } from "shared";

import { GeoRenderer } from "./render";

function getPosition(
    options?: PositionOptions,
): Promise<{ coords: info.LatLong }> {
    return new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, options),
    );
}

class WebFetcher implements fetcher.IFetcher {
    fetch(url: string): Promise<fetcher.IFetchResult> {
        return fetch(url);
    }
}

type State =
    | { status: "loading" }
    | {
          status: "ready";
          date: Date;
          location: info.LatLong;
          nearbyStops: request.NearbyStopsResponse;
          departures: info.Departure[];
      }
    | { status: "error"; message: string };

type Props = {
    lat: number | undefined;
    long: number | undefined;
    d: number | undefined;
};

class GeoDepsTable extends React.Component<Props, State> {
    #stringCache = new stringCache.StringCache();

    constructor(props: Props) {
        super(props);
        this.state = { status: "loading" };
    }

    override componentDidMount?() {
        this.update();
    }

    override componentWillUnmount() {}

    renderHeader(): ReactElement {
        let top: ReactElement;
        switch (this.state.status) {
            case "loading":
            case "error":
                top = <div>MVV Departures</div>;
                break;
            case "ready": {
                const date = this.state.date;
                const h = date.getHours();
                const m =
                    date.getMinutes() < 10
                        ? "0" + this.state.date.getMinutes()
                        : date.getMinutes().toString();
                const href = this.#stringCache.locationUrl(this.state.location);
                top = (
                    <div>
                        MVV Departures around{" "}
                        <a href={href} target="_blank">
                            you
                        </a>
                        &nbsp; at {h}:{m}
                    </div>
                );
            }
        }

        return (
            <div className="departures-header">
                {top}
                <span className="disclaimer">
                    Not an official service of MVV
                    <a
                        href="https://www.paypal.com/donate?hosted_button_id=SVH3NYCAR3UAN"
                        className="donate"
                        target="_blank"
                    >
                        <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif" />
                    </a>
                </span>
            </div>
        );
    }

    private renderNonReadyState(e: ReactElement): ReactElement {
        return (
            <div className="box">
                {this.renderHeader()}
                <div className="spacer" />
                <div className="loading-box">{e}</div>
                <div className="spacer" />
            </div>
        );
    }

    override render(): ReactElement {
        switch (this.state.status) {
            case "ready": {
                const r = new GeoRenderer(
                    this.#stringCache,
                    new Date(this.state.date),
                    this.state.nearbyStops.request,
                    this.state.nearbyStops.stops,
                );
                const table = r.renderTable(this.state.departures);
                return (
                    <div className="box">
                        {this.renderHeader()}
                        <div className="table-container">{table}</div>
                    </div>
                );
            }
            case "loading":
                return this.renderNonReadyState(
                    <div className="loading">
                        Loading...
                        <span className="loader" />
                    </div>,
                );

            case "error":
                return this.renderNonReadyState(
                    <div className="loading">{this.state.message}</div>,
                );
        }
    }

    async update() {
        let c: { coords: info.LatLong };
        if (this.props.lat && this.props.long) {
            c = {
                coords: {
                    latitude: this.props.lat,
                    longitude: this.props.long,
                },
            };
        } else {
            try {
                c = await getPosition();
            } catch (e) {
                this.setState({
                    status: "error",
                    message: `Geolocation failed: ${e}`,
                });
                return;
            }
        }
        const d = this.props.d ? this.props.d : 500;
        const r = await fetch(
            `/api/v1/stopsNearby?lat=${c.coords.latitude}&long=${c.coords.longitude}&d=${d}`,
        );
        if (!r.ok) {
            this.setState({
                status: "error",
                message: `Fetching stops nearby failed: ${r.statusText}`,
            });
            return;
        }
        const resp: request.NearbyStopsResponse = await r.json();
        const q = new queryDepartures.Q(
            [],
            resp.stops.map((s) => s.stop),
            new WebFetcher(),
        );
        const now = new Date();
        const departures = await q.getDeparturesForMultipleStops(
            resp.request,
            now,
        );
        this.setState({
            status: "ready",
            date: now,
            location: c.coords,
            nearbyStops: resp,
            departures,
        });
    }
}

const p = new URLSearchParams(window.location.search);
let lat = p.get("lat") != null ? +p.get("lat")! : undefined;
let long = p.get("long") != null ? +p.get("long")! : undefined;
let d = p.get("d") != null ? +p.get("d")! : undefined;

lat = lat && isNaN(lat) ? undefined : lat;
long = long && isNaN(long) ? undefined : long;
d = d && isNaN(d) ? undefined : d;

const root = createRoot(document.body);
root.render(<GeoDepsTable lat={lat} long={long} d={d}></GeoDepsTable>);
