/**
 * Writes the sample icons in docs/icons from the real drawing code, one per
 * class in MVV-ICONS.md. Run with `bazel run //server:icon_samples`.
 * docs/icons/preview.png is a screenshot and is not redrawn.
 */
import * as fs from "node:fs";
import * as path from "node:path";

import * as icons from "./icons.ts";

const SAMPLES: Record<string, icons.LineForIcon> = {
    "X208.svg": {
        name: "X208",
        product: "ExpressBus",
        id: "mvv:20208: :H:s26",
    },
    "X730.svg": {
        name: "X730",
        product: "ExpressBus",
        id: "mvv:20730: :H:s26",
    },
    "SEV-S6.svg": {
        name: "SEV S6",
        product: "Ersatzverkehr",
        id: "ddb:870S6:A:H:j26",
    },
    "SEV-RB65.svg": {
        name: "SEV RB65",
        product: "Ersatzverkehr",
        id: "ddb:87RB6:5:H:j26",
    },
    "SEV-U3.svg": { name: "U3", product: "SEV", id: "swm:35503:G:H:016" },
    "SEV-21.svg": { name: "21", product: "SEV", id: "swm:34521:G:H:016" },
    "SEV-N19.svg": { name: "N19", product: "SEV", id: "swm:36719:G:H:016" },
    "Tram-14.svg": { name: "14", product: "Tram", id: "swm:02014:G:H:016" },
    "Bus-O7.svg": { name: "O7", product: "Bus", id: "swm:03407:G:H:016" },
    "Flex-5680.svg": {
        name: "5680",
        product: "FLEXlinie",
        id: "mvv:16568:0:H:s26",
    },
    "AST-8160.svg": { name: "8160", product: "AST", id: "lvg:02816:0:H:s26" },
    "Generic-4047.svg": {
        name: "4047",
        product: "Regionalbus",
        id: "vvt:01404:7:H:j26",
    },
    "Bus-438.svg": icons.overrides.get("12438.svg")!,
};

// bazel run sets BUILD_WORKSPACE_DIRECTORY to the repository's root.
const root = process.env.BUILD_WORKSPACE_DIRECTORY ?? process.cwd();
const dir = path.join(root, "docs", "icons");
for (const [file, line] of Object.entries(SAMPLES)) {
    fs.writeFileSync(path.join(dir, file), icons.drawIcon(line));
}
console.log(`Wrote ${Object.keys(SAMPLES).length} icons to ${dir}`);
