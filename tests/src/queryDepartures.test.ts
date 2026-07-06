import { testing } from "shared";

import { test as normalize } from "./normalize.test";
import { test as discovery } from "./discovery.test";
import { test as midnight } from "./midnight.test";
import { test as multistop } from "./multistop.test";
import { test as urlGetDepartures } from "./urlGetDepartures.test";
import { test as urlDiscovery } from "./urlDiscovery.test";
import { test as urlMidnight } from "./urlMidnight.test";
import { test as karlsplatz } from "./karlsplatz.test";

// Each *.test.ts exports a single Test (the result of a testAsync call); this
// combines them into one suite.
async function main() {
    const ok = await testing.suite(
        normalize,
        discovery,
        midnight,
        multistop,
        urlGetDepartures,
        urlDiscovery,
        urlMidnight,
        karlsplatz,
    );
    if (!ok) process.exitCode = 1;
}

main();
