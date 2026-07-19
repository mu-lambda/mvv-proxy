import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync("Real Hbf with some trains", async () => {
    const { q } = await newQ("hbf_real.json");
    const req: request.SingleStop = {
        stopGid: "de:09162:100",
        lines: [],
        timeToStop: 0,
    };
    const departures = await q.getDepartures(req, new Date(1784453004 * 1000));

    expect(departures.length).toBe(40);

    expect(departures[0]!.stop.gid).toBe("de:09162:100");
    expect(departures[0]!.line.name).toBe("S1");
    expect(departures[0]!.line.symbol).toBe("92M01.svg");
    expect(departures[0]!.line.destination).toBe("Flughafen München");
    expect(departures[0]!.line.mvvApiId).toBe("ddb:92M01: :R:j26");
    expect(departures[0]!.departure.date).toBe("20260719");
    expect(departures[0]!.departure.planned).toBe("11:22");
    expect(departures[0]!.departure.live).toBe("11:24");
    expect(departures[0]!.departure.inTime).toBe(false);
    expect(departures[0]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[0]!.departurePoint?.designation).toBe(2);

    expect(departures[1]!.stop.gid).toBe("de:09162:100");
    expect(departures[1]!.line.name).toBe("S1");
    expect(departures[1]!.line.symbol).toBe("92M01.svg");
    expect(departures[1]!.line.destination).toBe("Freising");
    expect(departures[1]!.line.mvvApiId).toBe("ddb:92M01: :R:j26");
    expect(departures[1]!.departure.date).toBe("20260719");
    expect(departures[1]!.departure.planned).toBe("11:22");
    expect(departures[1]!.departure.live).toBe("11:24");
    expect(departures[1]!.departure.inTime).toBe(false);
    expect(departures[1]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[1]!.departurePoint?.designation).toBe(2);

    expect(departures[2]!.stop.gid).toBe("de:09162:100");
    expect(departures[2]!.line.name).toBe("S8");
    expect(departures[2]!.line.symbol).toBe("92M08.svg");
    expect(departures[2]!.line.destination).toBe("Herrsching");
    expect(departures[2]!.line.mvvApiId).toBe("ddb:92M08: :R:j26");
    expect(departures[2]!.departure.date).toBe("20260719");
    expect(departures[2]!.departure.planned).toBe("11:24");
    expect(departures[2]!.departure.live).toBe("11:26");
    expect(departures[2]!.departure.inTime).toBe(false);
    expect(departures[2]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[2]!.departurePoint?.designation).toBe(2);

    expect(departures[3]!.stop.gid).toBe("de:09162:100");
    expect(departures[3]!.line.name).toBe("S5");
    expect(departures[3]!.line.symbol).toBe("92M05.svg");
    expect(departures[3]!.line.destination).toBe("Höhenkirchen-Siegertsbrunn");
    expect(departures[3]!.line.mvvApiId).toBe("ddb:92M05: :H:j26");
    expect(departures[3]!.departure.date).toBe("20260719");
    expect(departures[3]!.departure.planned).toBe("11:25");
    expect(departures[3]!.departure.live).toBe("11:25");
    expect(departures[3]!.departure.inTime).toBe(true);
    expect(departures[3]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[3]!.departurePoint?.designation).toBe(1);

    expect(departures[4]!.stop.gid).toBe("de:09162:100");
    expect(departures[4]!.line.name).toBe("S6");
    expect(departures[4]!.line.symbol).toBe("92M06.svg");
    expect(departures[4]!.line.destination).toBe("Grafing-Bahnhof");
    expect(departures[4]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[4]!.departure.date).toBe("20260719");
    expect(departures[4]!.departure.planned).toBe("11:27");
    expect(departures[4]!.departure.live).toBe("11:30");
    expect(departures[4]!.departure.inTime).toBe(false);
    expect(departures[4]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[4]!.departurePoint?.designation).toBe(1);

    expect(departures[5]!.stop.gid).toBe("de:09162:100");
    expect(departures[5]!.line.name).toBe("S2");
    expect(departures[5]!.line.symbol).toBe("92M02.svg");
    expect(departures[5]!.line.destination).toBe("Petershausen");
    expect(departures[5]!.line.mvvApiId).toBe("ddb:92M02: :R:j26");
    expect(departures[5]!.departure.date).toBe("20260719");
    expect(departures[5]!.departure.planned).toBe("11:28");
    expect(departures[5]!.departure.live).toBe("11:28");
    expect(departures[5]!.departure.inTime).toBe(true);
    expect(departures[5]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[5]!.departurePoint?.designation).toBe(2);

    expect(departures[6]!.stop.gid).toBe("de:09162:100");
    expect(departures[6]!.line.name).toBe("S2");
    expect(departures[6]!.line.symbol).toBe("92M02.svg");
    expect(departures[6]!.line.destination).toBe("Markt Schwaben");
    expect(departures[6]!.line.mvvApiId).toBe("ddb:92M02: :H:j26");
    expect(departures[6]!.departure.date).toBe("20260719");
    expect(departures[6]!.departure.planned).toBe("11:29");
    expect(departures[6]!.departure.live).toBe("11:32");
    expect(departures[6]!.departure.inTime).toBe(false);
    expect(departures[6]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[6]!.departurePoint?.designation).toBe(1);

    expect(departures[7]!.stop.gid).toBe("de:09162:100");
    expect(departures[7]!.line.name).toBe("S6");
    expect(departures[7]!.line.symbol).toBe("92M06.svg");
    expect(departures[7]!.line.destination).toBe("Tutzing");
    expect(departures[7]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[7]!.departure.date).toBe("20260719");
    expect(departures[7]!.departure.planned).toBe("11:30");
    expect(departures[7]!.departure.live).toBe("11:37");
    expect(departures[7]!.departure.inTime).toBe(false);
    expect(departures[7]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[7]!.departurePoint?.designation).toBe(2);

    expect(departures[8]!.stop.gid).toBe("de:09162:100");
    expect(departures[8]!.line.name).toBe("S5");
    expect(departures[8]!.line.symbol).toBe("92M05.svg");
    expect(departures[8]!.line.destination).toBe("Pasing");
    expect(departures[8]!.line.mvvApiId).toBe("ddb:92M05:P:R:j26");
    expect(departures[8]!.departure.date).toBe("20260719");
    expect(departures[8]!.departure.planned).toBe("11:32");
    expect(departures[8]!.departure.live).toBe("11:35");
    expect(departures[8]!.departure.inTime).toBe(false);
    expect(departures[8]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[8]!.departurePoint?.designation).toBe(2);

    expect(departures[9]!.stop.gid).toBe("de:09162:100");
    expect(departures[9]!.line.name).toBe("S8");
    expect(departures[9]!.line.symbol).toBe("92M08.svg");
    expect(departures[9]!.line.destination).toBe("Leuchtenbergring");
    expect(departures[9]!.line.mvvApiId).toBe("ddb:92M08: :H:j26");
    expect(departures[9]!.departure.date).toBe("20260719");
    expect(departures[9]!.departure.planned).toBe("11:33");
    expect(departures[9]!.departure.live).toBe("11:34");
    expect(departures[9]!.departure.inTime).toBe(false);
    expect(departures[9]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[9]!.departurePoint?.designation).toBe(1);

    expect(departures[10]!.stop.gid).toBe("de:09162:100");
    expect(departures[10]!.line.name).toBe("S7");
    expect(departures[10]!.line.symbol).toBe("92M07.svg");
    expect(departures[10]!.line.destination).toBe("Wolfratshausen");
    expect(departures[10]!.line.mvvApiId).toBe("ddb:92M07: :R:j26");
    expect(departures[10]!.departure.date).toBe("20260719");
    expect(departures[10]!.departure.planned).toBe("11:34");
    expect(departures[10]!.departure.live).toBe("11:34");
    expect(departures[10]!.departure.inTime).toBe(true);
    expect(departures[10]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[10]!.departurePoint?.designation).toBe(36);

    expect(departures[11]!.stop.gid).toBe("de:09162:100");
    expect(departures[11]!.line.name).toBe("S1");
    expect(departures[11]!.line.symbol).toBe("92M01.svg");
    expect(departures[11]!.line.destination).toBe("Ostbahnhof");
    expect(departures[11]!.line.mvvApiId).toBe("ddb:92M01: :H:j26");
    expect(departures[11]!.departure.date).toBe("20260719");
    expect(departures[11]!.departure.planned).toBe("11:35");
    expect(departures[11]!.departure.live).toBe("11:41");
    expect(departures[11]!.departure.inTime).toBe(false);
    expect(departures[11]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[11]!.departurePoint?.designation).toBe(1);

    expect(departures[12]!.stop.gid).toBe("de:09162:100");
    expect(departures[12]!.line.name).toBe("Lufthansa Express Bus");
    expect(departures[12]!.line.symbol).toBe("150LH.svg");
    expect(departures[12]!.line.destination).toBe(
        "Flughafen, Terminalbereich D/E",
    );
    expect(departures[12]!.line.mvvApiId).toBe("mvv:150LH: :H:s26");
    expect(departures[12]!.departure.date).toBe("20260719");
    expect(departures[12]!.departure.planned).toBe("11:35");
    expect(departures[12]!.departure.live).toBe(null);
    expect(departures[12]!.departure.inTime).toBe(true);
    expect(departures[12]!.departurePoint).toBe(undefined);

    expect(departures[13]!.stop.gid).toBe("de:09162:100");
    expect(departures[13]!.line.name).toBe("S4");
    expect(departures[13]!.line.symbol).toBe("92M04.svg");
    expect(departures[13]!.line.destination).toBe("Trudering");
    expect(departures[13]!.line.mvvApiId).toBe("ddb:92M04: :H:j26");
    expect(departures[13]!.departure.date).toBe("20260719");
    expect(departures[13]!.departure.planned).toBe("11:37");
    expect(departures[13]!.departure.live).toBe("11:43");
    expect(departures[13]!.departure.inTime).toBe(false);
    expect(departures[13]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[13]!.departurePoint?.designation).toBe(1);

    expect(departures[14]!.stop.gid).toBe("de:09162:100");
    expect(departures[14]!.line.name).toBe("S3");
    expect(departures[14]!.line.symbol).toBe("92M03.svg");
    expect(departures[14]!.line.destination).toBe("Maisach");
    expect(departures[14]!.line.mvvApiId).toBe("ddb:92M03: :R:j26");
    expect(departures[14]!.departure.date).toBe("20260719");
    expect(departures[14]!.departure.planned).toBe("11:37");
    expect(departures[14]!.departure.live).toBe("11:39");
    expect(departures[14]!.departure.inTime).toBe(false);
    expect(departures[14]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[14]!.departurePoint?.designation).toBe(2);

    expect(departures[15]!.stop.gid).toBe("de:09162:100");
    expect(departures[15]!.line.name).toBe("S3");
    expect(departures[15]!.line.symbol).toBe("92M03.svg");
    expect(departures[15]!.line.destination).toBe("Holzkirchen");
    expect(departures[15]!.line.mvvApiId).toBe("ddb:92M03: :H:j26");
    expect(departures[15]!.departure.date).toBe("20260719");
    expect(departures[15]!.departure.planned).toBe("11:39");
    expect(departures[15]!.departure.live).toBe("11:43");
    expect(departures[15]!.departure.inTime).toBe(false);
    expect(departures[15]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[15]!.departurePoint?.designation).toBe(1);

    expect(departures[16]!.stop.gid).toBe("de:09162:100");
    expect(departures[16]!.line.name).toBe("S4");
    expect(departures[16]!.line.symbol).toBe("92M04.svg");
    expect(departures[16]!.line.destination).toBe("Geltendorf");
    expect(departures[16]!.line.mvvApiId).toBe("ddb:92M04: :R:j26");
    expect(departures[16]!.departure.date).toBe("20260719");
    expect(departures[16]!.departure.planned).toBe("11:39");
    expect(departures[16]!.departure.live).toBe("11:42");
    expect(departures[16]!.departure.inTime).toBe(false);
    expect(departures[16]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[16]!.departurePoint?.designation).toBe(2);

    expect(departures[17]!.stop.gid).toBe("de:09162:100");
    expect(departures[17]!.line.name).toBe("S1");
    expect(departures[17]!.line.symbol).toBe("92M01.svg");
    expect(departures[17]!.line.destination).toBe("Flughafen München");
    expect(departures[17]!.line.mvvApiId).toBe("ddb:92M01: :R:j26");
    expect(departures[17]!.departure.date).toBe("20260719");
    expect(departures[17]!.departure.planned).toBe("11:42");
    expect(departures[17]!.departure.live).toBe("11:42");
    expect(departures[17]!.departure.inTime).toBe(true);
    expect(departures[17]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[17]!.departurePoint?.designation).toBe(2);

    expect(departures[18]!.stop.gid).toBe("de:09162:100");
    expect(departures[18]!.line.name).toBe("S8");
    expect(departures[18]!.line.symbol).toBe("92M08.svg");
    expect(departures[18]!.line.destination).toBe("Herrsching");
    expect(departures[18]!.line.mvvApiId).toBe("ddb:92M08: :R:j26");
    expect(departures[18]!.departure.date).toBe("20260719");
    expect(departures[18]!.departure.planned).toBe("11:44");
    expect(departures[18]!.departure.live).toBe("11:45");
    expect(departures[18]!.departure.inTime).toBe(false);
    expect(departures[18]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[18]!.departurePoint?.designation).toBe(2);

    expect(departures[19]!.stop.gid).toBe("de:09162:100");
    expect(departures[19]!.line.name).toBe("S5");
    expect(departures[19]!.line.symbol).toBe("92M05.svg");
    expect(departures[19]!.line.destination).toBe("Kreuzstraße");
    expect(departures[19]!.line.mvvApiId).toBe("ddb:92M05: :H:j26");
    expect(departures[19]!.departure.date).toBe("20260719");
    expect(departures[19]!.departure.planned).toBe("11:45");
    expect(departures[19]!.departure.live).toBe("11:45");
    expect(departures[19]!.departure.inTime).toBe(true);
    expect(departures[19]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[19]!.departurePoint?.designation).toBe(1);

    expect(departures[20]!.stop.gid).toBe("de:09162:100");
    expect(departures[20]!.line.name).toBe("S6");
    expect(departures[20]!.line.symbol).toBe("92M06.svg");
    expect(departures[20]!.line.destination).toBe("Ebersberg");
    expect(departures[20]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[20]!.departure.date).toBe("20260719");
    expect(departures[20]!.departure.planned).toBe("11:47");
    expect(departures[20]!.departure.live).toBe("11:50");
    expect(departures[20]!.departure.inTime).toBe(false);
    expect(departures[20]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[20]!.departurePoint?.designation).toBe(1);

    expect(departures[21]!.stop.gid).toBe("de:09162:100");
    expect(departures[21]!.line.name).toBe("S2");
    expect(departures[21]!.line.symbol).toBe("92M02.svg");
    expect(departures[21]!.line.destination).toBe("Petershausen");
    expect(departures[21]!.line.mvvApiId).toBe("ddb:92M02: :R:j26");
    expect(departures[21]!.departure.date).toBe("20260719");
    expect(departures[21]!.departure.planned).toBe("11:48");
    expect(departures[21]!.departure.live).toBe("11:50");
    expect(departures[21]!.departure.inTime).toBe(false);
    expect(departures[21]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[21]!.departurePoint?.designation).toBe(2);

    expect(departures[22]!.stop.gid).toBe("de:09162:100");
    expect(departures[22]!.line.name).toBe("S2");
    expect(departures[22]!.line.symbol).toBe("92M02.svg");
    expect(departures[22]!.line.destination).toBe("Erding");
    expect(departures[22]!.line.mvvApiId).toBe("ddb:92M02: :H:j26");
    expect(departures[22]!.departure.date).toBe("20260719");
    expect(departures[22]!.departure.planned).toBe("11:49");
    expect(departures[22]!.departure.live).toBe("11:52");
    expect(departures[22]!.departure.inTime).toBe(false);
    expect(departures[22]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[22]!.departurePoint?.designation).toBe(1);

    expect(departures[23]!.stop.gid).toBe("de:09162:100");
    expect(departures[23]!.line.name).toBe("S6");
    expect(departures[23]!.line.symbol).toBe("92M06.svg");
    expect(departures[23]!.line.destination).toBe("Tutzing");
    expect(departures[23]!.line.mvvApiId).toBe("ddb:92M06: :R:j26");
    expect(departures[23]!.departure.date).toBe("20260719");
    expect(departures[23]!.departure.planned).toBe("11:50");
    expect(departures[23]!.departure.live).toBe("12:02");
    expect(departures[23]!.departure.inTime).toBe(false);
    expect(departures[23]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[23]!.departurePoint?.designation).toBe(2);

    expect(departures[24]!.stop.gid).toBe("de:09162:100");
    expect(departures[24]!.line.name).toBe("S5");
    expect(departures[24]!.line.symbol).toBe("92M05.svg");
    expect(departures[24]!.line.destination).toBe("Pasing");
    expect(departures[24]!.line.mvvApiId).toBe("ddb:92M05:P:R:j26");
    expect(departures[24]!.departure.date).toBe("20260719");
    expect(departures[24]!.departure.planned).toBe("11:52");
    expect(departures[24]!.departure.live).toBe("11:56");
    expect(departures[24]!.departure.inTime).toBe(false);
    expect(departures[24]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[24]!.departurePoint?.designation).toBe(2);

    expect(departures[25]!.stop.gid).toBe("de:09162:100");
    expect(departures[25]!.line.name).toBe("S8");
    expect(departures[25]!.line.symbol).toBe("92M08.svg");
    expect(departures[25]!.line.destination).toBe("Leuchtenbergring");
    expect(departures[25]!.line.mvvApiId).toBe("ddb:92M08: :H:j26");
    expect(departures[25]!.departure.date).toBe("20260719");
    expect(departures[25]!.departure.planned).toBe("11:53");
    expect(departures[25]!.departure.live).toBe("11:53");
    expect(departures[25]!.departure.inTime).toBe(true);
    expect(departures[25]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[25]!.departurePoint?.designation).toBe(1);

    expect(departures[26]!.stop.gid).toBe("de:09162:100");
    expect(departures[26]!.line.name).toBe("S7");
    expect(departures[26]!.line.symbol).toBe("92M07.svg");
    expect(departures[26]!.line.destination).toBe("Wolfratshausen");
    expect(departures[26]!.line.mvvApiId).toBe("ddb:92M07: :R:j26");
    expect(departures[26]!.departure.date).toBe("20260719");
    expect(departures[26]!.departure.planned).toBe("11:54");
    expect(departures[26]!.departure.live).toBe(null);
    expect(departures[26]!.departure.inTime).toBe(true);
    expect(departures[26]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[26]!.departurePoint?.designation).toBe(36);

    expect(departures[27]!.stop.gid).toBe("de:09162:100");
    expect(departures[27]!.line.name).toBe("S1");
    expect(departures[27]!.line.symbol).toBe("92M01.svg");
    expect(departures[27]!.line.destination).toBe("Ostbahnhof");
    expect(departures[27]!.line.mvvApiId).toBe("ddb:92M01: :H:j26");
    expect(departures[27]!.departure.date).toBe("20260719");
    expect(departures[27]!.departure.planned).toBe("11:55");
    expect(departures[27]!.departure.live).toBe("11:55");
    expect(departures[27]!.departure.inTime).toBe(true);
    expect(departures[27]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[27]!.departurePoint?.designation).toBe(1);

    expect(departures[28]!.stop.gid).toBe("de:09162:100");
    expect(departures[28]!.line.name).toBe("Lufthansa Express Bus");
    expect(departures[28]!.line.symbol).toBe("150LH.svg");
    expect(departures[28]!.line.destination).toBe(
        "Flughafen, Terminalbereich D/E",
    );
    expect(departures[28]!.line.mvvApiId).toBe("mvv:150LH: :H:s26");
    expect(departures[28]!.departure.date).toBe("20260719");
    expect(departures[28]!.departure.planned).toBe("11:55");
    expect(departures[28]!.departure.live).toBe(null);
    expect(departures[28]!.departure.inTime).toBe(true);
    expect(departures[28]!.departurePoint).toBe(undefined);

    expect(departures[29]!.stop.gid).toBe("de:09162:100");
    expect(departures[29]!.line.name).toBe("S3");
    expect(departures[29]!.line.symbol).toBe("92M03.svg");
    expect(departures[29]!.line.destination).toBe("Mammendorf");
    expect(departures[29]!.line.mvvApiId).toBe("ddb:92M03: :R:j26");
    expect(departures[29]!.departure.date).toBe("20260719");
    expect(departures[29]!.departure.planned).toBe("11:57");
    expect(departures[29]!.departure.live).toBe("11:59");
    expect(departures[29]!.departure.inTime).toBe(false);
    expect(departures[29]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[29]!.departurePoint?.designation).toBe(2);

    expect(departures[30]!.stop.gid).toBe("de:09162:100");
    expect(departures[30]!.line.name).toBe("S4");
    expect(departures[30]!.line.symbol).toBe("92M04.svg");
    expect(departures[30]!.line.destination).toBe("Trudering");
    expect(departures[30]!.line.mvvApiId).toBe("ddb:92M04: :H:j26");
    expect(departures[30]!.departure.date).toBe("20260719");
    expect(departures[30]!.departure.planned).toBe("11:57");
    expect(departures[30]!.departure.live).toBe("11:57");
    expect(departures[30]!.departure.inTime).toBe(true);
    expect(departures[30]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[30]!.departurePoint?.designation).toBe(1);

    expect(departures[31]!.stop.gid).toBe("de:09162:100");
    expect(departures[31]!.line.name).toBe("S4");
    expect(departures[31]!.line.symbol).toBe("92M04.svg");
    expect(departures[31]!.line.destination).toBe("Geltendorf");
    expect(departures[31]!.line.mvvApiId).toBe("ddb:92M04: :R:j26");
    expect(departures[31]!.departure.date).toBe("20260719");
    expect(departures[31]!.departure.planned).toBe("11:59");
    expect(departures[31]!.departure.live).toBe("12:02");
    expect(departures[31]!.departure.inTime).toBe(false);
    expect(departures[31]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[31]!.departurePoint?.designation).toBe(2);

    expect(departures[32]!.stop.gid).toBe("de:09162:100");
    expect(departures[32]!.line.name).toBe("S3");
    expect(departures[32]!.line.symbol).toBe("92M03.svg");
    expect(departures[32]!.line.destination).toBe("Holzkirchen");
    expect(departures[32]!.line.mvvApiId).toBe("ddb:92M03: :H:j26");
    expect(departures[32]!.departure.date).toBe("20260719");
    expect(departures[32]!.departure.planned).toBe("11:59");
    expect(departures[32]!.departure.live).toBe("12:01");
    expect(departures[32]!.departure.inTime).toBe(false);
    expect(departures[32]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[32]!.departurePoint?.designation).toBe(1);

    expect(departures[33]!.stop.gid).toBe("de:09162:100");
    expect(departures[33]!.line.name).toBe("S1");
    expect(departures[33]!.line.symbol).toBe("92M01.svg");
    expect(departures[33]!.line.destination).toBe("Freising");
    expect(departures[33]!.line.mvvApiId).toBe("ddb:92M01: :R:j26");
    expect(departures[33]!.departure.date).toBe("20260719");
    expect(departures[33]!.departure.planned).toBe("12:02");
    expect(departures[33]!.departure.live).toBe(null);
    expect(departures[33]!.departure.inTime).toBe(true);
    expect(departures[33]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[33]!.departurePoint?.designation).toBe(2);

    expect(departures[34]!.stop.gid).toBe("de:09162:100");
    expect(departures[34]!.line.name).toBe("S1");
    expect(departures[34]!.line.symbol).toBe("92M01.svg");
    expect(departures[34]!.line.destination).toBe("Flughafen München");
    expect(departures[34]!.line.mvvApiId).toBe("ddb:92M01: :R:j26");
    expect(departures[34]!.departure.date).toBe("20260719");
    expect(departures[34]!.departure.planned).toBe("12:02");
    expect(departures[34]!.departure.live).toBe(null);
    expect(departures[34]!.departure.inTime).toBe(true);
    expect(departures[34]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[34]!.departurePoint?.designation).toBe(2);

    expect(departures[35]!.stop.gid).toBe("de:09162:100");
    expect(departures[35]!.line.name).toBe("S8");
    expect(departures[35]!.line.symbol).toBe("92M08.svg");
    expect(departures[35]!.line.destination).toBe("Herrsching");
    expect(departures[35]!.line.mvvApiId).toBe("ddb:92M08: :R:j26");
    expect(departures[35]!.departure.date).toBe("20260719");
    expect(departures[35]!.departure.planned).toBe("12:04");
    expect(departures[35]!.departure.live).toBe(null);
    expect(departures[35]!.departure.inTime).toBe(true);
    expect(departures[35]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[35]!.departurePoint?.designation).toBe(2);

    expect(departures[36]!.stop.gid).toBe("de:09162:100");
    expect(departures[36]!.line.name).toBe("S5");
    expect(departures[36]!.line.symbol).toBe("92M05.svg");
    expect(departures[36]!.line.destination).toBe("Aying");
    expect(departures[36]!.line.mvvApiId).toBe("ddb:92M05: :H:j26");
    expect(departures[36]!.departure.date).toBe("20260719");
    expect(departures[36]!.departure.planned).toBe("12:05");
    expect(departures[36]!.departure.live).toBe(null);
    expect(departures[36]!.departure.inTime).toBe(true);
    expect(departures[36]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[36]!.departurePoint?.designation).toBe(1);

    expect(departures[37]!.stop.gid).toBe("de:09162:100");
    expect(departures[37]!.line.name).toBe("S6");
    expect(departures[37]!.line.symbol).toBe("92M06.svg");
    expect(departures[37]!.line.destination).toBe("Ebersberg");
    expect(departures[37]!.line.mvvApiId).toBe("ddb:92M06: :H:j26");
    expect(departures[37]!.departure.date).toBe("20260719");
    expect(departures[37]!.departure.planned).toBe("12:07");
    expect(departures[37]!.departure.live).toBe("12:10");
    expect(departures[37]!.departure.inTime).toBe(false);
    expect(departures[37]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[37]!.departurePoint?.designation).toBe(1);

    expect(departures[38]!.stop.gid).toBe("de:09162:100");
    expect(departures[38]!.line.name).toBe("S2");
    expect(departures[38]!.line.symbol).toBe("92M02.svg");
    expect(departures[38]!.line.destination).toBe("Altomünster");
    expect(departures[38]!.line.mvvApiId).toBe("ddb:92M02: :R:j26");
    expect(departures[38]!.departure.date).toBe("20260719");
    expect(departures[38]!.departure.planned).toBe("12:08");
    expect(departures[38]!.departure.live).toBe("12:09");
    expect(departures[38]!.departure.inTime).toBe(false);
    expect(departures[38]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[38]!.departurePoint?.designation).toBe(2);

    expect(departures[39]!.stop.gid).toBe("de:09162:100");
    expect(departures[39]!.line.name).toBe("S2");
    expect(departures[39]!.line.symbol).toBe("92M02.svg");
    expect(departures[39]!.line.destination).toBe("Erding");
    expect(departures[39]!.line.mvvApiId).toBe("ddb:92M02: :H:j26");
    expect(departures[39]!.departure.date).toBe("20260719");
    expect(departures[39]!.departure.planned).toBe("12:09");
    expect(departures[39]!.departure.live).toBe("12:12");
    expect(departures[39]!.departure.inTime).toBe(false);
    expect(departures[39]!.departurePoint?.kind).toBe("Gleis");
    expect(departures[39]!.departurePoint?.designation).toBe(1);
});
