import React, { ReactElement, useEffect, useRef, useState } from "react";
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
    | { status: "initial" }
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
    canQuery: boolean;
};

function GeoDepsTable({ lat, long, d: dProp, canQuery }: Props): ReactElement {
    const d = dProp ? dProp : 500;
    const autoLoad = canQuery || !!(lat && long);

    const [state, setState] = useState<State>(() =>
        autoLoad ? { status: "loading" } : { status: "initial" },
    );

    const stringCacheRef = useRef<stringCache.StringCache | null>(null);
    if (stringCacheRef.current === null) {
        stringCacheRef.current = new stringCache.StringCache();
    }
    const cache = stringCacheRef.current;

    async function update() {
        setState({ status: "loading" });
        let c: { coords: info.LatLong };
        if (lat && long) {
            c = {
                coords: {
                    latitude: lat,
                    longitude: long,
                },
            };
        } else {
            try {
                c = await getPosition();
            } catch (e: any) {
                setState({
                    status: "error",
                    message:
                        "message" in e
                            ? (e.message as string)
                            : "Geolocation failed",
                });
                return;
            }
        }
        const r = await fetch(
            `/api/v1/stopsNearby?lat=${c.coords.latitude}&long=${c.coords.longitude}&d=${d}`,
        );
        if (!r.ok) {
            setState({
                status: "error",
                message: `Fetching stops nearby failed: ${await r.text()}`,
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
        try {
            const departures = await q.getDeparturesForMultipleStops(
                resp.request,
                now,
            );
            setState({
                status: "ready",
                date: now,
                location: c.coords,
                nearbyStops: resp,
                departures,
            });
        } catch (e: any) {
            setState({
                status: "error",
                message: "message" in e ? (e.message as string) : "Try again",
            });
        }
    }

    // Mount-only, mirroring componentDidMount: kick off the first load when the
    // initial state was "loading". Later loads come from the buttons.
    useEffect(() => {
        if (autoLoad) {
            update();
        }
    }, []);

    function renderHeader(): ReactElement {
        let top: ReactElement;
        switch (state.status) {
            case "initial":
            case "loading":
            case "error":
                top = <div>MVV Departures</div>;
                break;
            case "ready": {
                const date = state.date;
                const h = date.getHours();
                const m =
                    date.getMinutes() < 10
                        ? "0" + date.getMinutes()
                        : date.getMinutes().toString();
                const href = cache.locationUrl(state.location);
                top = (
                    <div>
                        MVV Departures around{" "}
                        <a href={href} target="_blank">
                            you
                        </a>{" "}
                        at {h}:{m}
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

    function renderNonReadyState(
        e: ReactElement,
        button?: ReactElement,
    ): ReactElement {
        const b = button ? button : "";
        return (
            <div className="box">
                {renderHeader()}
                <div className="spacer" />
                <div className="loading-box">{e}</div>
                <div className="spacer" />
                {b}
            </div>
        );
    }

    function reloadButton(): ReactElement {
        return (
            <button
                className="floating-button"
                onClick={() => {
                    update();
                }}
            >
                <img src="/map-pin-alt-svgrepo-com.svg" />
            </button>
        );
    }

    function startButton(): ReactElement {
        return (
            <button
                className="floating-button start"
                onClick={() => {
                    update();
                }}
            >
                <img src="/map-pin-alt-svgrepo-com.svg" />
            </button>
        );
    }

    switch (state.status) {
        case "initial":
            return renderNonReadyState(
                <div className="loading">
                    Press <img src="/map-pin-alt-svgrepo-com.svg" /> to see
                    departures around you.
                </div>,
                startButton(),
            );

        case "loading":
            return renderNonReadyState(
                <div className="loading">
                    Loading...
                    <span className="loader" />
                </div>,
            );

        case "ready": {
            if (state.nearbyStops.stops.length == 0) {
                return renderNonReadyState(
                    <div className="loading">
                        No stops within {d} m from here
                    </div>,
                    reloadButton(),
                );
            }
            if (state.departures.length == 0) {
                return renderNonReadyState(
                    <div className="loading">
                        No departures within {state.nearbyStops.request.limit}{" "}
                        minutes
                    </div>,
                    reloadButton(),
                );
            }
            const r = new GeoRenderer(
                cache,
                new Date(state.date),
                state.nearbyStops.request,
                state.nearbyStops.stops,
            );
            const table = r.renderTable(state.departures);
            return (
                <div className="box">
                    {renderHeader()}
                    <div className="table-container">{table}</div>
                    {reloadButton()}
                </div>
            );
        }
        case "error":
            return renderNonReadyState(
                <div className="loading">{state.message}</div>,
                reloadButton(),
            );
    }
}

const p = new URLSearchParams(window.location.search);
let lat = p.get("lat") != null ? +p.get("lat")! : undefined;
let long = p.get("long") != null ? +p.get("long")! : undefined;
let d = p.get("d") != null ? +p.get("d")! : undefined;

lat = lat && isNaN(lat) ? undefined : lat;
long = long && isNaN(long) ? undefined : long;
d = d && isNaN(d) ? undefined : d;

async function setup() {
    let canQuery: boolean;
    try {
        const state = await navigator.permissions.query({
            name: "geolocation",
        });
        canQuery = state.state === "granted";
    } catch {
        canQuery = false;
    }
    const root = createRoot(document.body);
    root.render(
        <GeoDepsTable
            lat={lat}
            long={long}
            d={d}
            canQuery={canQuery}
        ></GeoDepsTable>,
    );
}

setup();
