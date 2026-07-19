import { testing } from "shared";

import { test as normalize } from "./normalize.test";
import { test as discovery } from "./discovery.test";
import { test as midnight } from "./midnight.test";
import { test as multistop } from "./multistop.test";
import { test as multistopLimit } from "./multistopLimit.test";
import { test as multistopPast } from "./multistopPast.test";
import { test as urlGetDepartures } from "./urlGetDepartures.test";
import { test as urlDiscovery } from "./urlDiscovery.test";
import { test as urlMidnight } from "./urlMidnight.test";
import { test as karlsplatz } from "./karlsplatz.test";
import { test as mulitstopReal } from "./multistopReal.test";
import { test as hbf } from "./hbf.test";
import { test as hbfReal } from "./hbf_real.test";
import { test as planegg } from "./planegg.test";

// Each *.test.ts exports a single Test (the result of a testAsync call); this
// combines them into one suite.
async function main() {
    const ok = await testing.suite(
        normalize,
        discovery,
        midnight,
        multistop,
        multistopLimit,
        multistopPast,
        urlGetDepartures,
        urlDiscovery,
        urlMidnight,
        karlsplatz,
        mulitstopReal,
        hbf,
        hbfReal,
        planegg,
    );
    if (!ok) process.exitCode = 1;
}

main();
