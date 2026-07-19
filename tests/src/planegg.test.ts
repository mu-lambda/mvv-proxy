import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync("Planegg real departures", async () => {
    const { q } = await newQ("planegg.json");
    const req: request.SingleStop = {
        stopGid: "de:09184:2600",
        lines: [],
        timeToStop: 0,
    };
    const departures = await q.getDepartures(req, new Date(1784453170 * 1000));

    expect(departures.length).toBe(40);

    expect(departures[0]!.stop.gid).toBe("de:09184:2600");
    expect(departures[0]!.line.name).toBe("S6");
    expect(departures[0]!.line.symbol).toBe("92M06.svg");
    expect(departures[0]!.line.destination).toBe("Ebersberg");
    expect(departures[0]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[0]!.departure.date).toBe("20260719");
    expect(departures[0]!.departure.planned).toBe("11:28");
    expect(departures[0]!.departure.live).toBe("11:30");
    expect(departures[0]!.departure.inTime).toBe(false);

    expect(departures[1]!.stop.gid).toBe("de:09184:2600");
    expect(departures[1]!.line.name).toBe("S6");
    expect(departures[1]!.line.symbol).toBe("92M06.svg");
    expect(departures[1]!.line.destination).toBe("Tutzing");
    expect(departures[1]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[1]!.departure.date).toBe("20260719");
    expect(departures[1]!.departure.planned).toBe("11:32");
    expect(departures[1]!.departure.live).toBe("11:32");
    expect(departures[1]!.departure.inTime).toBe(true);

    expect(departures[2]!.stop.gid).toBe("de:09184:2600");
    expect(departures[2]!.line.name).toBe("265");
    expect(departures[2]!.line.symbol).toBe("19265.svg");
    expect(departures[2]!.line.destination).toBe("Pasing (S)");
    expect(departures[2]!.line.mvvApiId).toBe("mvv:19265: :R:s26");
    expect(departures[2]!.departure.date).toBe("20260719");
    expect(departures[2]!.departure.planned).toBe("11:41");
    expect(departures[2]!.departure.live).toBe("11:41");
    expect(departures[2]!.departure.inTime).toBe(true);

    expect(departures[3]!.stop.gid).toBe("de:09184:2600");
    expect(departures[3]!.line.name).toBe("967");
    expect(departures[3]!.line.symbol).toBe("19967.svg");
    expect(departures[3]!.line.destination).toBe(
        "Krailling, Muggenthalerstraße",
    );
    expect(departures[3]!.line.mvvApiId).toBe("mvv:19967: :H:s26");
    expect(departures[3]!.departure.date).toBe("20260719");
    expect(departures[3]!.departure.planned).toBe("11:43");
    expect(departures[3]!.departure.live).toBe("11:43");
    expect(departures[3]!.departure.inTime).toBe(true);

    expect(departures[4]!.stop.gid).toBe("de:09184:2600");
    expect(departures[4]!.line.name).toBe("S6");
    expect(departures[4]!.line.symbol).toBe("92M06.svg");
    expect(departures[4]!.line.destination).toBe("Ebersberg");
    expect(departures[4]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[4]!.departure.date).toBe("20260719");
    expect(departures[4]!.departure.planned).toBe("11:48");
    expect(departures[4]!.departure.live).toBe("11:50");
    expect(departures[4]!.departure.inTime).toBe(false);

    expect(departures[5]!.stop.gid).toBe("de:09184:2600");
    expect(departures[5]!.line.name).toBe("S6");
    expect(departures[5]!.line.symbol).toBe("92M06.svg");
    expect(departures[5]!.line.destination).toBe("Tutzing");
    expect(departures[5]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[5]!.departure.date).toBe("20260719");
    expect(departures[5]!.departure.planned).toBe("11:52");
    expect(departures[5]!.departure.live).toBe("11:57");
    expect(departures[5]!.departure.inTime).toBe(false);

    expect(departures[6]!.stop.gid).toBe("de:09184:2600");
    expect(departures[6]!.line.name).toBe("258");
    expect(departures[6]!.line.symbol).toBe("19258.svg");
    expect(departures[6]!.line.destination).toBe(
        "Lochham, Starnberger Straße ü. Lochham (S)",
    );
    expect(departures[6]!.line.mvvApiId).toBe("mvv:19258: :R:s26");
    expect(departures[6]!.departure.date).toBe("20260719");
    expect(departures[6]!.departure.planned).toBe("11:57");
    expect(departures[6]!.departure.live).toBe(null);
    expect(departures[6]!.departure.inTime).toBe(true);

    expect(departures[7]!.stop.gid).toBe("de:09184:2600");
    expect(departures[7]!.line.name).toBe("266");
    expect(departures[7]!.line.symbol).toBe("19266.svg");
    expect(departures[7]!.line.destination).toBe("Klinikum Großhadern (U)");
    expect(departures[7]!.line.mvvApiId).toBe("mvv:19266: :H:s26");
    expect(departures[7]!.departure.date).toBe("20260719");
    expect(departures[7]!.departure.planned).toBe("11:59");
    expect(departures[7]!.departure.live).toBe(null);
    expect(departures[7]!.departure.inTime).toBe(true);

    expect(departures[8]!.stop.gid).toBe("de:09184:2600");
    expect(departures[8]!.line.name).toBe("258");
    expect(departures[8]!.line.symbol).toBe("19258.svg");
    expect(departures[8]!.line.destination).toBe("Gräfelfing (S)");
    expect(departures[8]!.line.mvvApiId).toBe("mvv:19258: :H:s26");
    expect(departures[8]!.departure.date).toBe("20260719");
    expect(departures[8]!.departure.planned).toBe("12:02");
    expect(departures[8]!.departure.live).toBe(null);
    expect(departures[8]!.departure.inTime).toBe(true);

    expect(departures[9]!.stop.gid).toBe("de:09184:2600");
    expect(departures[9]!.line.name).toBe("S6");
    expect(departures[9]!.line.symbol).toBe("92M06.svg");
    expect(departures[9]!.line.destination).toBe("Grafing-Bahnhof");
    expect(departures[9]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[9]!.departure.date).toBe("20260719");
    expect(departures[9]!.departure.planned).toBe("12:08");
    expect(departures[9]!.departure.live).toBe("12:08");
    expect(departures[9]!.departure.inTime).toBe(true);

    expect(departures[10]!.stop.gid).toBe("de:09184:2600");
    expect(departures[10]!.line.name).toBe("S6");
    expect(departures[10]!.line.symbol).toBe("92M06.svg");
    expect(departures[10]!.line.destination).toBe("Tutzing");
    expect(departures[10]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[10]!.departure.date).toBe("20260719");
    expect(departures[10]!.departure.planned).toBe("12:12");
    expect(departures[10]!.departure.live).toBe("12:22");
    expect(departures[10]!.departure.inTime).toBe(false);

    expect(departures[11]!.stop.gid).toBe("de:09184:2600");
    expect(departures[11]!.line.name).toBe("967");
    expect(departures[11]!.line.symbol).toBe("19967.svg");
    expect(departures[11]!.line.destination).toBe("Krailling, Sperberweg");
    expect(departures[11]!.line.mvvApiId).toBe("mvv:19967: :H:s26");
    expect(departures[11]!.departure.date).toBe("20260719");
    expect(departures[11]!.departure.planned).toBe("12:18");
    expect(departures[11]!.departure.live).toBe("12:18");
    expect(departures[11]!.departure.inTime).toBe(true);

    expect(departures[12]!.stop.gid).toBe("de:09184:2600");
    expect(departures[12]!.line.name).toBe("266");
    expect(departures[12]!.line.symbol).toBe("19266.svg");
    expect(departures[12]!.line.destination).toBe("Klinikum Großhadern (U)");
    expect(departures[12]!.line.mvvApiId).toBe("mvv:19266: :H:s26");
    expect(departures[12]!.departure.date).toBe("20260719");
    expect(departures[12]!.departure.planned).toBe("12:19");
    expect(departures[12]!.departure.live).toBe(null);
    expect(departures[12]!.departure.inTime).toBe(true);

    expect(departures[13]!.stop.gid).toBe("de:09184:2600");
    expect(departures[13]!.line.name).toBe("265");
    expect(departures[13]!.line.symbol).toBe("19265.svg");
    expect(departures[13]!.line.destination).toBe("Pasing (S)");
    expect(departures[13]!.line.mvvApiId).toBe("mvv:19265: :R:s26");
    expect(departures[13]!.departure.date).toBe("20260719");
    expect(departures[13]!.departure.planned).toBe("12:21");
    expect(departures[13]!.departure.live).toBe("12:21");
    expect(departures[13]!.departure.inTime).toBe(true);

    expect(departures[14]!.stop.gid).toBe("de:09184:2600");
    expect(departures[14]!.line.name).toBe("S6");
    expect(departures[14]!.line.symbol).toBe("92M06.svg");
    expect(departures[14]!.line.destination).toBe("Ebersberg");
    expect(departures[14]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[14]!.departure.date).toBe("20260719");
    expect(departures[14]!.departure.planned).toBe("12:28");
    expect(departures[14]!.departure.live).toBe(null);
    expect(departures[14]!.departure.inTime).toBe(true);

    expect(departures[15]!.stop.gid).toBe("de:09184:2600");
    expect(departures[15]!.line.name).toBe("S6");
    expect(departures[15]!.line.symbol).toBe("92M06.svg");
    expect(departures[15]!.line.destination).toBe("Tutzing");
    expect(departures[15]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[15]!.departure.date).toBe("20260719");
    expect(departures[15]!.departure.planned).toBe("12:32");
    expect(departures[15]!.departure.live).toBe("12:42");
    expect(departures[15]!.departure.inTime).toBe(false);

    expect(departures[16]!.stop.gid).toBe("de:09184:2600");
    expect(departures[16]!.line.name).toBe("258");
    expect(departures[16]!.line.symbol).toBe("19258.svg");
    expect(departures[16]!.line.destination).toBe(
        "Lochham, Starnberger Straße ü. Lochham (S)",
    );
    expect(departures[16]!.line.mvvApiId).toBe("mvv:19258: :R:s26");
    expect(departures[16]!.departure.date).toBe("20260719");
    expect(departures[16]!.departure.planned).toBe("12:37");
    expect(departures[16]!.departure.live).toBe(null);
    expect(departures[16]!.departure.inTime).toBe(true);

    expect(departures[17]!.stop.gid).toBe("de:09184:2600");
    expect(departures[17]!.line.name).toBe("967");
    expect(departures[17]!.line.symbol).toBe("19967.svg");
    expect(departures[17]!.line.destination).toBe(
        "Krailling, Altenheim Maria Eich",
    );
    expect(departures[17]!.line.mvvApiId).toBe("mvv:19967: :H:s26");
    expect(departures[17]!.departure.date).toBe("20260719");
    expect(departures[17]!.departure.planned).toBe("12:38");
    expect(departures[17]!.departure.live).toBe("12:38");
    expect(departures[17]!.departure.inTime).toBe(true);

    expect(departures[18]!.stop.gid).toBe("de:09184:2600");
    expect(departures[18]!.line.name).toBe("258");
    expect(departures[18]!.line.symbol).toBe("19258.svg");
    expect(departures[18]!.line.destination).toBe("Gräfelfing (S)");
    expect(departures[18]!.line.mvvApiId).toBe("mvv:19258: :H:s26");
    expect(departures[18]!.departure.date).toBe("20260719");
    expect(departures[18]!.departure.planned).toBe("12:42");
    expect(departures[18]!.departure.live).toBe(null);
    expect(departures[18]!.departure.inTime).toBe(true);

    expect(departures[19]!.stop.gid).toBe("de:09184:2600");
    expect(departures[19]!.line.name).toBe("S6");
    expect(departures[19]!.line.symbol).toBe("92M06.svg");
    expect(departures[19]!.line.destination).toBe("Ebersberg");
    expect(departures[19]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[19]!.departure.date).toBe("20260719");
    expect(departures[19]!.departure.planned).toBe("12:48");
    expect(departures[19]!.departure.live).toBe(null);
    expect(departures[19]!.departure.inTime).toBe(true);

    expect(departures[20]!.stop.gid).toBe("de:09184:2600");
    expect(departures[20]!.line.name).toBe("S6");
    expect(departures[20]!.line.symbol).toBe("92M06.svg");
    expect(departures[20]!.line.destination).toBe("Tutzing");
    expect(departures[20]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[20]!.departure.date).toBe("20260719");
    expect(departures[20]!.departure.planned).toBe("12:52");
    expect(departures[20]!.departure.live).toBe("13:02");
    expect(departures[20]!.departure.inTime).toBe(false);

    expect(departures[21]!.stop.gid).toBe("de:09184:2600");
    expect(departures[21]!.line.name).toBe("967");
    expect(departures[21]!.line.symbol).toBe("19967.svg");
    expect(departures[21]!.line.destination).toBe(
        "Krailling, Muggenthalerstraße",
    );
    expect(departures[21]!.line.mvvApiId).toBe("mvv:19967: :H:s26");
    expect(departures[21]!.departure.date).toBe("20260719");
    expect(departures[21]!.departure.planned).toBe("12:58");
    expect(departures[21]!.departure.live).toBe(null);
    expect(departures[21]!.departure.inTime).toBe(true);

    expect(departures[22]!.stop.gid).toBe("de:09184:2600");
    expect(departures[22]!.line.name).toBe("266");
    expect(departures[22]!.line.symbol).toBe("19266.svg");
    expect(departures[22]!.line.destination).toBe("Klinikum Großhadern (U)");
    expect(departures[22]!.line.mvvApiId).toBe("mvv:19266: :H:s26");
    expect(departures[22]!.departure.date).toBe("20260719");
    expect(departures[22]!.departure.planned).toBe("12:59");
    expect(departures[22]!.departure.live).toBe(null);
    expect(departures[22]!.departure.inTime).toBe(true);

    expect(departures[23]!.stop.gid).toBe("de:09184:2600");
    expect(departures[23]!.line.name).toBe("265");
    expect(departures[23]!.line.symbol).toBe("19265.svg");
    expect(departures[23]!.line.destination).toBe("Pasing (S)");
    expect(departures[23]!.line.mvvApiId).toBe("mvv:19265: :R:s26");
    expect(departures[23]!.departure.date).toBe("20260719");
    expect(departures[23]!.departure.planned).toBe("13:01");
    expect(departures[23]!.departure.live).toBe(null);
    expect(departures[23]!.departure.inTime).toBe(true);

    expect(departures[24]!.stop.gid).toBe("de:09184:2600");
    expect(departures[24]!.line.name).toBe("S6");
    expect(departures[24]!.line.symbol).toBe("92M06.svg");
    expect(departures[24]!.line.destination).toBe("Grafing-Bahnhof");
    expect(departures[24]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[24]!.departure.date).toBe("20260719");
    expect(departures[24]!.departure.planned).toBe("13:08");
    expect(departures[24]!.departure.live).toBe(null);
    expect(departures[24]!.departure.inTime).toBe(true);

    expect(departures[25]!.stop.gid).toBe("de:09184:2600");
    expect(departures[25]!.line.name).toBe("S6");
    expect(departures[25]!.line.symbol).toBe("92M06.svg");
    expect(departures[25]!.line.destination).toBe("Tutzing");
    expect(departures[25]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[25]!.departure.date).toBe("20260719");
    expect(departures[25]!.departure.planned).toBe("13:12");
    expect(departures[25]!.departure.live).toBe("13:22");
    expect(departures[25]!.departure.inTime).toBe(false);

    expect(departures[26]!.stop.gid).toBe("de:09184:2600");
    expect(departures[26]!.line.name).toBe("258");
    expect(departures[26]!.line.symbol).toBe("19258.svg");
    expect(departures[26]!.line.destination).toBe(
        "Lochham, Starnberger Straße ü. Lochham (S)",
    );
    expect(departures[26]!.line.mvvApiId).toBe("mvv:19258: :R:s26");
    expect(departures[26]!.departure.date).toBe("20260719");
    expect(departures[26]!.departure.planned).toBe("13:17");
    expect(departures[26]!.departure.live).toBe(null);
    expect(departures[26]!.departure.inTime).toBe(true);

    expect(departures[27]!.stop.gid).toBe("de:09184:2600");
    expect(departures[27]!.line.name).toBe("967");
    expect(departures[27]!.line.symbol).toBe("19967.svg");
    expect(departures[27]!.line.destination).toBe("Krailling, Sperberweg");
    expect(departures[27]!.line.mvvApiId).toBe("mvv:19967: :H:s26");
    expect(departures[27]!.departure.date).toBe("20260719");
    expect(departures[27]!.departure.planned).toBe("13:18");
    expect(departures[27]!.departure.live).toBe(null);
    expect(departures[27]!.departure.inTime).toBe(true);

    expect(departures[28]!.stop.gid).toBe("de:09184:2600");
    expect(departures[28]!.line.name).toBe("266");
    expect(departures[28]!.line.symbol).toBe("19266.svg");
    expect(departures[28]!.line.destination).toBe("Klinikum Großhadern (U)");
    expect(departures[28]!.line.mvvApiId).toBe("mvv:19266: :H:s26");
    expect(departures[28]!.departure.date).toBe("20260719");
    expect(departures[28]!.departure.planned).toBe("13:19");
    expect(departures[28]!.departure.live).toBe(null);
    expect(departures[28]!.departure.inTime).toBe(true);

    expect(departures[29]!.stop.gid).toBe("de:09184:2600");
    expect(departures[29]!.line.name).toBe("258");
    expect(departures[29]!.line.symbol).toBe("19258.svg");
    expect(departures[29]!.line.destination).toBe("Gräfelfing (S)");
    expect(departures[29]!.line.mvvApiId).toBe("mvv:19258: :H:s26");
    expect(departures[29]!.departure.date).toBe("20260719");
    expect(departures[29]!.departure.planned).toBe("13:22");
    expect(departures[29]!.departure.live).toBe(null);
    expect(departures[29]!.departure.inTime).toBe(true);

    expect(departures[30]!.stop.gid).toBe("de:09184:2600");
    expect(departures[30]!.line.name).toBe("S6");
    expect(departures[30]!.line.symbol).toBe("92M06.svg");
    expect(departures[30]!.line.destination).toBe("Ebersberg");
    expect(departures[30]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[30]!.departure.date).toBe("20260719");
    expect(departures[30]!.departure.planned).toBe("13:28");
    expect(departures[30]!.departure.live).toBe(null);
    expect(departures[30]!.departure.inTime).toBe(true);

    expect(departures[31]!.stop.gid).toBe("de:09184:2600");
    expect(departures[31]!.line.name).toBe("S6");
    expect(departures[31]!.line.symbol).toBe("92M06.svg");
    expect(departures[31]!.line.destination).toBe("Tutzing");
    expect(departures[31]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[31]!.departure.date).toBe("20260719");
    expect(departures[31]!.departure.planned).toBe("13:32");
    expect(departures[31]!.departure.live).toBe("13:42");
    expect(departures[31]!.departure.inTime).toBe(false);

    expect(departures[32]!.stop.gid).toBe("de:09184:2600");
    expect(departures[32]!.line.name).toBe("967");
    expect(departures[32]!.line.symbol).toBe("19967.svg");
    expect(departures[32]!.line.destination).toBe(
        "Krailling, Altenheim Maria Eich",
    );
    expect(departures[32]!.line.mvvApiId).toBe("mvv:19967: :H:s26");
    expect(departures[32]!.departure.date).toBe("20260719");
    expect(departures[32]!.departure.planned).toBe("13:38");
    expect(departures[32]!.departure.live).toBe(null);
    expect(departures[32]!.departure.inTime).toBe(true);

    expect(departures[33]!.stop.gid).toBe("de:09184:2600");
    expect(departures[33]!.line.name).toBe("265");
    expect(departures[33]!.line.symbol).toBe("19265.svg");
    expect(departures[33]!.line.destination).toBe("Pasing (S)");
    expect(departures[33]!.line.mvvApiId).toBe("mvv:19265: :R:s26");
    expect(departures[33]!.departure.date).toBe("20260719");
    expect(departures[33]!.departure.planned).toBe("13:41");
    expect(departures[33]!.departure.live).toBe(null);
    expect(departures[33]!.departure.inTime).toBe(true);

    expect(departures[34]!.stop.gid).toBe("de:09184:2600");
    expect(departures[34]!.line.name).toBe("S6");
    expect(departures[34]!.line.symbol).toBe("92M06.svg");
    expect(departures[34]!.line.destination).toBe("Ebersberg");
    expect(departures[34]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[34]!.departure.date).toBe("20260719");
    expect(departures[34]!.departure.planned).toBe("13:48");
    expect(departures[34]!.departure.live).toBe(null);
    expect(departures[34]!.departure.inTime).toBe(true);

    expect(departures[35]!.stop.gid).toBe("de:09184:2600");
    expect(departures[35]!.line.name).toBe("S6");
    expect(departures[35]!.line.symbol).toBe("92M06.svg");
    expect(departures[35]!.line.destination).toBe("Tutzing");
    expect(departures[35]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[35]!.departure.date).toBe("20260719");
    expect(departures[35]!.departure.planned).toBe("13:52");
    expect(departures[35]!.departure.live).toBe(null);
    expect(departures[35]!.departure.inTime).toBe(true);

    expect(departures[36]!.stop.gid).toBe("de:09184:2600");
    expect(departures[36]!.line.name).toBe("258");
    expect(departures[36]!.line.symbol).toBe("19258.svg");
    expect(departures[36]!.line.destination).toBe(
        "Lochham, Starnberger Straße ü. Lochham (S)",
    );
    expect(departures[36]!.line.mvvApiId).toBe("mvv:19258: :R:s26");
    expect(departures[36]!.departure.date).toBe("20260719");
    expect(departures[36]!.departure.planned).toBe("13:57");
    expect(departures[36]!.departure.live).toBe(null);
    expect(departures[36]!.departure.inTime).toBe(true);

    expect(departures[37]!.stop.gid).toBe("de:09184:2600");
    expect(departures[37]!.line.name).toBe("967");
    expect(departures[37]!.line.symbol).toBe("19967.svg");
    expect(departures[37]!.line.destination).toBe(
        "Krailling, Muggenthalerstraße",
    );
    expect(departures[37]!.line.mvvApiId).toBe("mvv:19967: :H:s26");
    expect(departures[37]!.departure.date).toBe("20260719");
    expect(departures[37]!.departure.planned).toBe("13:58");
    expect(departures[37]!.departure.live).toBe(null);
    expect(departures[37]!.departure.inTime).toBe(true);

    expect(departures[38]!.stop.gid).toBe("de:09184:2600");
    expect(departures[38]!.line.name).toBe("266");
    expect(departures[38]!.line.symbol).toBe("19266.svg");
    expect(departures[38]!.line.destination).toBe("Klinikum Großhadern (U)");
    expect(departures[38]!.line.mvvApiId).toBe("mvv:19266: :H:s26");
    expect(departures[38]!.departure.date).toBe("20260719");
    expect(departures[38]!.departure.planned).toBe("13:59");
    expect(departures[38]!.departure.live).toBe(null);
    expect(departures[38]!.departure.inTime).toBe(true);

    expect(departures[39]!.stop.gid).toBe("de:09184:2600");
    expect(departures[39]!.line.name).toBe("258");
    expect(departures[39]!.line.symbol).toBe("19258.svg");
    expect(departures[39]!.line.destination).toBe("Gräfelfing (S)");
    expect(departures[39]!.line.mvvApiId).toBe("mvv:19258: :H:s26");
    expect(departures[39]!.departure.date).toBe("20260719");
    expect(departures[39]!.departure.planned).toBe("14:02");
    expect(departures[39]!.departure.live).toBe(null);
    expect(departures[39]!.departure.inTime).toBe(true);
});
