import React, { ReactElement } from "react";
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

class DepsTable extends React.Component<Props, State> {
    #stringCache = new stringCache.StringCache();
    #update: number | undefined;
    #stopUpdating = false;

    constructor(props: Props) {
        super(props);
        this.state = { status: "loading" };
        this.#update = props.update;
    }

    override componentDidMount?() {
        this.updateLoop();
    }

    override componentWillUnmount() {
        this.#stopUpdating = true;
    }

    override render(): ReactElement {
        switch (this.state.status) {
            case "ready": {
                const r = new Renderer(
                    this.#stringCache,
                    new Date(this.state.timetable.date),
                    this.state.timetable.request,
                );
                const table = r.renderTable(this.state.timetable.departures);
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
                        <div className="loading">{this.state.message}</div>
                    </div>
                );
            }
        }
    }

    async updateLoop() {
        while (!this.#stopUpdating) {
            console.log("Updating");
            const now = Math.floor(new Date().getTime() / 1000);
            try {
                const r = await fetch(`/api/v1/timetable?timestamp=${now}`);
                if (!r.ok) {
                    throw new Error(`${r.status}: ${await r.text()}`);
                }
                this.setState({ status: "ready", timetable: await r.json() });
            } catch (e) {
                this.setState({ status: "error", message: `${e}` });
            }
            if (!this.#update) return;
            await sleep(this.#update);
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
