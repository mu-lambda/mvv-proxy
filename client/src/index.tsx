import React, { ReactElement, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
    stringCache,
    strings,
    request,
    info,
    queryDepartures,
    fetcher,
} from "shared";

import { GeoRenderer } from "./render.tsx";
/** The page's text, in the language the server wrote into <html lang>. */
const t = strings.forLang(strings.langOf(document.documentElement.lang));

function getPosition(
    options?: PositionOptions,
): Promise<{ coords: info.LatLong }> {
    return new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, options),
    );
}

/**
 * The error's message, or `fallback` if it has none. Anything can be thrown,
 * including strings, where `"message" in e` would itself throw.
 */
function messageOf(e: unknown, fallback: string): string {
    if (
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof e.message === "string" &&
        e.message !== ""
    ) {
        return e.message;
    }
    return fallback;
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
          // The nearby stops are known; `done[i]` says whether stops[i]'s
          // departures are in.
          status: "fetching";
          stops: info.StopWithDistance[];
          done: boolean[];
      }
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

    // Counts loads, so that a stop reported by an older load cannot tick off a
    // stop in a newer one.
    const loadRef = useRef(0);

    async function update() {
        const load = ++loadRef.current;
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
            } catch (e) {
                setState({
                    status: "error",
                    message: messageOf(e, t.geolocationFailed),
                });
                return;
            }
        }
        try {
            const r = await fetch(
                `/api/v1/stopsNearby?lat=${c.coords.latitude}&long=${c.coords.longitude}&d=${d}`,
            );
            if (!r.ok) {
                setState({
                    status: "error",
                    message: t.stopsFailed(await r.text()),
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
            // With no stops, there is nothing to tick off: "ready" says so.
            if (resp.stops.length > 0) {
                setState({
                    status: "fetching",
                    stops: resp.stops,
                    done: resp.stops.map(() => false),
                });
            }
            // resp.request.stops are resp.stops, in the same order, so an
            // index into one is an index into the other.
            const departures = await q.getDeparturesForMultipleStops(
                resp.request,
                now,
                (i) => {
                    if (load !== loadRef.current) {
                        return;
                    }
                    setState((prev) =>
                        prev.status === "fetching"
                            ? {
                                  ...prev,
                                  done: prev.done.map((d, j) => d || j === i),
                              }
                            : prev,
                    );
                },
            );
            setState({
                status: "ready",
                date: now,
                location: c.coords,
                nearbyStops: resp,
                departures,
            });
        } catch (e) {
            setState({ status: "error", message: messageOf(e, t.tryAgain) });
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
            case "fetching":
            case "error":
                top = <div>{t.title}</div>;
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
                        {t.header.before}
                        <a href={href} target="_blank">
                            {t.header.link}
                        </a>
                        {t.header.at}
                        {h}:{m}
                    </div>
                );
            }
        }

        return (
            <div className="departures-header">
                {top}
                <span className="disclaimer">
                    {t.notOfficial} · <a href="/impressum">{t.legalNotice}</a> ·{" "}
                    <a href="/datenschutz">{t.privacy}</a>
                    <a
                        href="https://www.paypal.com/donate?hosted_button_id=SVH3NYCAR3UAN"
                        className="donate"
                        target="_blank"
                    >
                        {/* Served from here, so visiting tells PayPal nothing. */}
                        <img src={t.donateImage} alt={t.donateAlt} />
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

    switch (state.status) {
        case "initial":
            // What the site is, before the browser asks for the location.
            return renderNonReadyState(
                <div className="intro">
                    <h1>{t.introHeading}</h1>
                    <p>{t.introText}</p>
                    <button className="intro-start" onClick={() => update()}>
                        <img src="/map-pin-alt-svgrepo-com.svg" alt="" />
                        {t.introButton}
                    </button>
                    <p className="intro-privacy">
                        {t.introLocation} <a href="/datenschutz">{t.privacy}</a>
                    </p>
                </div>,
            );

        case "loading":
            return renderNonReadyState(
                <div className="loading">
                    {t.loading}
                    <span className="loader" />
                </div>,
            );

        case "fetching":
            return renderNonReadyState(
                <div className="loading">
                    {t.fetching(state.stops.length)}
                    <ul className="stop-progress">
                        {state.stops
                            .map((s, i) => ({ s, i }))
                            .sort((a, b) => a.s.distance - b.s.distance)
                            .map(({ s, i }) => (
                                <li key={i}>
                                    {state.done[i] ? (
                                        <span className="stop-done">✓</span>
                                    ) : (
                                        <span className="loader stop-pending" />
                                    )}
                                    {s.stop.name} ·{" "}
                                    {Math.floor(s.distance / 10) * 10} m
                                </li>
                            ))}
                    </ul>
                </div>,
            );

        case "ready": {
            if (state.nearbyStops.stops.length == 0) {
                return renderNonReadyState(
                    <div className="loading">{t.noStops(d)}</div>,
                    reloadButton(),
                );
            }
            if (state.departures.length == 0) {
                return renderNonReadyState(
                    <div className="loading">
                        {t.noDepartures(state.nearbyStops.request.limit)}
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
