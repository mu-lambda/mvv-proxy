import { testing } from "shared";

import { test as normalize } from "./normalize.test.ts";
import { test as discovery } from "./discovery.test.ts";
import { test as midnight } from "./midnight.test.ts";
import { test as multistop } from "./multistop.test.ts";
import { test as multistopLimit } from "./multistopLimit.test.ts";
import { test as multistopPast } from "./multistopPast.test.ts";
import { test as urlGetDepartures } from "./urlGetDepartures.test.ts";
import { test as urlDiscovery } from "./urlDiscovery.test.ts";
import { test as urlMidnight } from "./urlMidnight.test.ts";
import { test as karlsplatz } from "./karlsplatz.test.ts";
import { test as mulitstopReal } from "./multistopReal.test.ts";
import { test as hbf } from "./hbf.test.ts";
import { test as hbfReal } from "./hbf_real.test.ts";
import { test as planegg } from "./planegg.test.ts";
import { test as missingDepartures } from "./missingDepartures.test.ts";

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
        missingDepartures,
    );
    if (!ok) process.exitCode = 1;
}

main();
