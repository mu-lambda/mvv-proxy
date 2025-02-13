import React, { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { stringCache, request } from "shared";

import { Renderer } from "./render2";

console.log("Here!");

interface IProps {}

type State = 
    { status : "loading" } |
    { status : "ready",
      timetable : request.TimetableResponse };

class Table extends React.Component<IProps, State> {
    #stringCache = new stringCache.StringCache();
    constructor(props: IProps) {
        super(props);
        this.setState({status: "loading"});
    }


   override componentDidMount?() {
   }

   override render(): ReactElement {
       if (this.state && this.state.status === "ready") {
           const r = new Renderer(
               this.#stringCache, this.state.timetable.date, 
               this.state.timetable.request);
           return <div>
            {r.render(this.state.timetable.departures)}
           </div>
       } else {
           
        return <div className="box">
            <div className="loading">Loading...<span className="loader" /></div>
        </div>
       }
   }
}

const root = createRoot(document.getElementById("root")!);
root.render(<Table></Table>);

