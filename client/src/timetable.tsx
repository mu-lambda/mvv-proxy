import React, { ReactElement, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { stringCache, request } from "shared";

import { Renderer } from "./render";

type Props = {
    update: number | undefined;
};

type State =
    | { status: "loading" }
    | { status: "ready"; timetable: request.TimetableResponse }
    | { status: "error"; message: string };

function sleep(msec: number): Promise<void> {
    return new Promise((r) => setTimeout(r, msec));
}

function DepsTable({ update }: Props): ReactElement {
    const [state, setState] = useState<State>({ status: "loading" });
    const stringCacheRef = useRef<stringCache.StringCache | null>(null);
    if (stringCacheRef.current === null) {
        stringCacheRef.current = new stringCache.StringCache();
    }
    const cache = stringCacheRef.current;

    useEffect(() => {
        let stopUpdating = false;

        async function updateLoop() {
            while (!stopUpdating) {
                console.log("Updating");
                const now = Math.floor(new Date().getTime() / 1000);
                try {
                    const r = await fetch(`/api/v1/timetable?timestamp=${now}`);
                    if (!r.ok) {
                        throw new Error(`${r.status}: ${await r.text()}`);
                    }
                    const timetable = await r.json();
                    if (!stopUpdating) {
                        setState({ status: "ready", timetable });
                    }
                } catch (e) {
                    if (!stopUpdating) {
                        setState({ status: "error", message: `${e}` });
                    }
                }
                if (!update) return;
                await sleep(update);
            }
        }

        updateLoop();

        return () => {
            stopUpdating = true;
        };
    }, [update]);

    switch (state.status) {
        case "ready": {
            if (state.timetable.departures.length == 0) {
                return (
                    <div className="loading-box">
                        <div className="loading">
                            No departures within {state.timetable.request.limit}{" "}
                            minutes.
                        </div>
                    </div>
                );
            }
            const r = new Renderer(
                cache,
                new Date(state.timetable.date),
                state.timetable.request,
            );
            const table = r.renderTable(state.timetable.departures);
            return <div className="box">{table}</div>;
        }
        case "loading": {
            return (
                <div className="loading-box">
                    <div className="loading">
                        Loading...
                        <span className="loader" />
                    </div>
                </div>
            );
        }
        case "error": {
            return (
                <div className="loading-box">
                    <div className="loading">{state.message}</div>
                </div>
            );
        }
    }
}

const p = new URLSearchParams(window.location.search).get("u");
let u = p !== null ? +p : undefined;
if (u && isNaN(u)) {
    throw new Error(`Bad u: ${u}`);
}
const root = createRoot(document.body);
root.render(<DepsTable update={u}></DepsTable>);
