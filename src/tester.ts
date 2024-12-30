import * as queryDepartures from "./queryDepartures";

async function main() {
    console.log("Start!");
    let q = new queryDepartures.Q([]);
    let o = await q.getDeparturesForMultipleStops(
        {
            stops: [
                {
                    stopGid: "de:09184:2600",
                    lines: ["S6-i", "S6-a"],
                    timeToStop: 0,
                },
                { stopGid: "de:09184:2941", lines: ["265-n"], timeToStop: 0 },
            ],
            limit: 10,
        },
        new Date(),
    );
    console.log(o);
}

main();
