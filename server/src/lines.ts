import { info } from "shared";

export const lines: info.Line[] = [
    // ./deps-from-stop.sh | sort | uniq  and manual editing.
    // -s/-n: Süd/Nord, -e/-w: East/West, -i/-a: stadtinwarts/stadtauswarts

    // Bus 258
    {
        mvvApiId: "mvv:19258: :H:s25",
        id: "258-s",
        name: "258",
        destination: "Gräfelfing (S) ü. Planegg (S)",
    },
    {
        mvvApiId: "mvv:19258: :R:s25",
        id: "258-n",
        name: "258",
        destination: "Lochham, Starnberger Straße ü. Lochham (S)",
    },

    // Bus 259
    {
        mvvApiId: "mvv:19259: :H:s25",
        id: "259-s",
        name: "259",
        destination: "Martinsried",
    },
    {
        mvvApiId: "mvv:19259: :R:s25",
        id: "259-n",
        name: "259",
        destination: "Pasing Bf.",
    },

    // Bus 260
    {
        mvvApiId: "mvv:19260: :H:s25",
        id: "260-e",
        name: "260",
        destination: "Fürstenried West (U)",
    },
    {
        mvvApiId: "mvv:19260: :R:s25",
        id: "260-w",
        name: "260",
        destination: "Germering-Unterpfaffenhofen (S) ü. Planegg (S) West",
    },

    // Bus 265
    {
        mvvApiId: "mvv:19265: :H:s25",
        id: "265-s",
        name: "265",
        destination: "Planegg (S)",
    },
    {
        mvvApiId: "mvv:19265: :R:s25",
        id: "265-n",
        name: "265",
        destination: "Pasing (S)",
    },

    // Bus 266
    {
        mvvApiId: "mvv:19266: :H:s25",
        id: "266-e",
        name: "266",
        destination: "Klinikum Großhadern (U)",
    },
    {
        mvvApiId: "mvv:19266: :R:s25",
        id: "266-w",
        name: "266",
        destination: "Planegg (S)",
    },

    // Bus 906
    {
        mvvApiId: "mvv:19906: :H:s25",
        id: "906-s",
        name: "906",
        destination: "Krailling, KIM/Konrad-Zuse-Bogen",
    },

    // Bus 962
    {
        mvvApiId: "mvv:19962: :H:s25",
        id: "962-e",
        name: "962",
        destination: "Fürstenried West (U)",
    },
    {
        mvvApiId: "mvv:19962: :R:s25",
        id: "962-w",
        name: "962",
        destination: "Gauting (S)",
    },

    // Bus 967
    {
        mvvApiId: "mvv:19967: :H:s25",
        id: "967-s",
        name: "967",
        destination: "Krailling, Muggenthalerstraße",
    },
    {
        mvvApiId: "mvv:19967: :R:s25",
        id: "967-n",
        name: "967",
        destination: "Planegg (S)",
    },

    // Express-bus 208
    {
        mvvApiId: "mvv:20208: :H:s25",
        id: "X208-e",
        name: "X208",
        destination: "Germering-Unterpfaffenhofen (S)",
    },
    {
        mvvApiId: "mvv:20208: :R:s25",
        id: "X208-w",
        name: "X208",
        destination: "Klinikum Großhadern (U)",
    },

    // Bus 56
    {
        mvvApiId: "swm:03056:G:H:015",
        id: "56-s",
        name: "56",
        destination: "Fürstenried West",
    },
    {
        mvvApiId: "swm:03056:G:R:015",
        id: "56-n",
        name: "56",
        destination: "Schloss Blutenburg",
    },

    // Bus 57
    {
        mvvApiId: "swm:03057:G:H:015",
        id: "57-e",
        name: "57",
        destination: "Laimer Platz",
    },
    {
        mvvApiId: "swm:03057:G:R:015",
        id: "57-w",
        name: "57",
        destination: "Freiham Bf.",
    },

    // S3
    {
        mvvApiId: "ddb:92M03: :H:j25",
        id: "S3-i",
        name: "S3",
        destination: "Holzkirchen",
    },
    {
        mvvApiId: "ddb:92M03: :R:j25",
        id: "S3-a",
        name: "S3",
        destination: "Mammendorf",
    },

    // S4
    {
        mvvApiId: "ddb:92M04: :H:j25",
        id: "S4-i",
        name: "S4",
        destination: "Trudering",
    },
    {
        mvvApiId: "ddb:92M04: :R:j25",
        id: "S4-a",
        name: "S4",
        destination: "Geltendorf",
    },

    // S5
    {
        mvvApiId: "ddb:92M05: :H:j25",
        id: "S5-a",
        name: "S5",
        destination: "Höhenkirchen-Siegertsbrunn",
    },
    {
        mvvApiId: "ddb:92M05: :H:j25",
        id: "S5-i",
        name: "S5",
        destination: "Kreuzstraße",
    },

    // S6
    {
        mvvApiId: "ddb:92M06: :H:j25",
        id: "S6-i",
        name: "S6",
        destination: "Ebersberg",
    },
    {
        mvvApiId: "ddb:92M06: :R:j25",
        id: "S6-a",
        name: "S6",
        destination: "Tutzing",
    },

    // S8
    {
        mvvApiId: "ddb:92M08: :H:j25",
        id: "S8-i",
        name: "S8",
        destination: "Flughafen München",
    },
    {
        mvvApiId: "ddb:92M08: :R:j25",
        id: "S8-a",
        name: "S8",
        destination: "Herrsching",
    },
];
