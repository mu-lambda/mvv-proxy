import { info } from "shared";

export const lines: info.Line[] = [
    // ./deps-from-stop.sh | sort | uniq  and manual editing.
    // -s/-n: Süd/Nord, -e/-w: East/West, -i/-a: stadtinwarts/stadtauswarts
    //
    // A line is its name (MVV's line number) and direction (H or R). Its MVV
    // id changes with the timetable, and sometimes in between, so Q looks it
    // up from the lines MVV lists for the stop.

    // Bus 258
    {
        direction: "H",
        id: "258-s",
        name: "258",
        destination: "Gräfelfing (S) ü. Planegg (S)",
    },
    {
        direction: "R",
        id: "258-n",
        name: "258",
        destination: "Lochham, Starnberger Straße ü. Lochham (S)",
    },

    // Bus 259
    {
        direction: "H",
        id: "259-s",
        name: "259",
        destination: "Martinsried",
    },
    {
        direction: "R",
        id: "259-n",
        name: "259",
        destination: "Pasing Bf.",
    },

    // Bus 260
    {
        direction: "H",
        id: "260-e",
        name: "260",
        destination: "Fürstenried West (U)",
    },
    {
        direction: "R",
        id: "260-w",
        name: "260",
        destination: "Germering-Unterpfaffenhofen (S) ü. Planegg (S) West",
    },

    // Bus 265
    {
        direction: "H",
        id: "265-s",
        name: "265",
        destination: "Planegg (S)",
    },
    {
        direction: "R",
        id: "265-n",
        name: "265",
        destination: "Pasing (S)",
    },

    // Bus 266
    {
        direction: "H",
        id: "266-e",
        name: "266",
        destination: "Klinikum Großhadern (U)",
    },
    {
        direction: "R",
        id: "266-w",
        name: "266",
        destination: "Planegg (S)",
    },

    // Bus 906
    {
        direction: "H",
        id: "906-s",
        name: "906",
        destination: "Krailling, KIM/Konrad-Zuse-Bogen",
    },

    // Bus 962
    {
        direction: "H",
        id: "962-e",
        name: "962",
        destination: "Fürstenried West (U)",
    },
    {
        direction: "R",
        id: "962-w",
        name: "962",
        destination: "Gauting (S)",
    },

    // Bus 967
    {
        direction: "H",
        id: "967-s",
        name: "967",
        destination: "Krailling, Muggenthalerstraße",
    },
    {
        direction: "R",
        id: "967-n",
        name: "967",
        destination: "Planegg (S)",
    },

    // Express-bus 208
    {
        direction: "H",
        id: "X208-e",
        name: "X208",
        destination: "Germering-Unterpfaffenhofen (S)",
    },
    {
        direction: "R",
        id: "X208-w",
        name: "X208",
        destination: "Klinikum Großhadern (U)",
    },

    // Bus 56
    {
        direction: "H",
        id: "56-s",
        name: "56",
        destination: "Fürstenried West",
    },
    {
        direction: "R",
        id: "56-n",
        name: "56",
        destination: "Schloss Blutenburg",
    },

    // Bus 57
    {
        direction: "H",
        id: "57-e",
        name: "57",
        destination: "Laimer Platz",
    },
    {
        direction: "R",
        id: "57-w",
        name: "57",
        destination: "Freiham Bf.",
    },

    // S3
    {
        direction: "H",
        id: "S3-i",
        name: "S3",
        destination: "Holzkirchen",
    },
    {
        direction: "R",
        id: "S3-a",
        name: "S3",
        destination: "Mammendorf",
    },

    // S4
    {
        direction: "H",
        id: "S4-i",
        name: "S4",
        destination: "Trudering",
    },
    {
        direction: "R",
        id: "S4-a",
        name: "S4",
        destination: "Geltendorf",
    },

    // S5
    {
        direction: "H",
        id: "S5-a",
        name: "S5",
        destination: "Höhenkirchen-Siegertsbrunn",
    },
    {
        direction: "H",
        id: "S5-i",
        name: "S5",
        destination: "Kreuzstraße",
    },

    // S6
    {
        direction: "H",
        id: "S6-i",
        name: "S6",
        destination: "Ebersberg",
    },
    {
        direction: "R",
        id: "S6-a",
        name: "S6",
        destination: "Tutzing",
    },

    // S8
    {
        direction: "H",
        id: "S8-i",
        name: "S8",
        destination: "Flughafen München",
    },
    {
        direction: "R",
        id: "S8-a",
        name: "S8",
        destination: "Herrsching",
    },

    // S6/8
    {
        direction: "R",
        id: "S6/8",
        name: "S6/8",
        destination: "Flughafen München",
    },
    // S8/6
    {
        direction: "R",
        id: "S8/6",
        name: "S8/6",
        destination: "Flughafen München",
    },

    // SEV S6-i
    {
        direction: "H",
        id: "SEV S6-i",
        name: "SEV S6",
        destination: "Pasing Bf. Nord",
    },
    // SEV S6-a
    {
        direction: "R",
        id: "SEV S6-a",
        name: "SEV S6",
        destination: "Gauting",
    },
    // SEV S6-i(DB)
    {
        direction: "H",
        id: "SEV S6-i(DB)",
        name: "SEV S6",
        destination: "Pasing Bf. Nord ",
    },
    // SEV S6-a(DB)
    {
        direction: "R",
        id: "SEV S6-a(DB)",
        name: "SEV S6",
        destination: "Gauting",
    },
];
