import { request } from "shared";
import { testAsync, expect, newQ } from "./fixtures";

export const test = testAsync("Hbf with tracks", async () => {
    const { q } = await newQ("hbf.json");
    const req: request.SingleStop = {
        stopGid: "de:09162:6",
        lines: [],
        timeToStop: 0,
    };
    const departures = await q.getDepartures(req, new Date(1784452665 * 1000));

    expect(departures.length).toBe(40);

    expect(departures[0]!.stop.gid).toBe("de:09162:6");
    expect(departures[0]!.line.name).toBe("18");
    expect(departures[0]!.line.symbol).toBe("02018.svg");
    expect(departures[0]!.line.destination).toBe("Hochschule München");
    expect(departures[0]!.line.mvvApiId).toBe("swm:02018:G:H:016");
    expect(departures[0]!.departure.date).toBe("20260719");
    expect(departures[0]!.departure.planned).toBe("11:16");
    expect(departures[0]!.departure.live).toBe("11:17");
    expect(departures[0]!.departure.inTime).toBe(false);

    expect(departures[1]!.stop.gid).toBe("de:09162:6");
    expect(departures[1]!.line.name).toBe("19");
    expect(departures[1]!.line.symbol).toBe("02019.svg");
    expect(departures[1]!.line.destination).toBe("Pasing Bf.");
    expect(departures[1]!.line.mvvApiId).toBe("swm:02019:G:R:016");
    expect(departures[1]!.departure.date).toBe("20260719");
    expect(departures[1]!.departure.planned).toBe("11:17");
    expect(departures[1]!.departure.live).toBe("11:17");
    expect(departures[1]!.departure.inTime).toBe(true);

    expect(departures[2]!.stop.gid).toBe("de:09162:6");
    expect(departures[2]!.line.name).toBe("U1");
    expect(departures[2]!.line.symbol).toBe("010U1.svg");
    expect(departures[2]!.line.destination).toBe("Mangfallplatz");
    expect(departures[2]!.line.mvvApiId).toBe("swm:010U1:G:H:016");
    expect(departures[2]!.departure.date).toBe("20260719");
    expect(departures[2]!.departure.planned).toBe("11:17");
    expect(departures[2]!.departure.live).toBe("11:18");
    expect(departures[2]!.departure.inTime).toBe(false);

    expect(departures[3]!.stop.gid).toBe("de:09162:6");
    expect(departures[3]!.line.name).toBe("U2");
    expect(departures[3]!.line.symbol).toBe("010U2.svg");
    expect(departures[3]!.line.destination).toBe("Feldmoching");
    expect(departures[3]!.line.mvvApiId).toBe("swm:010U2:G:R:016");
    expect(departures[3]!.departure.date).toBe("20260719");
    expect(departures[3]!.departure.planned).toBe("11:18");
    expect(departures[3]!.departure.live).toBe("11:20");
    expect(departures[3]!.departure.inTime).toBe(false);

    expect(departures[4]!.stop.gid).toBe("de:09162:6");
    expect(departures[4]!.line.name).toBe("U1");
    expect(departures[4]!.line.symbol).toBe("010U1.svg");
    expect(departures[4]!.line.destination).toBe("Gern");
    expect(departures[4]!.line.mvvApiId).toBe("swm:010U1:G:R:016");
    expect(departures[4]!.departure.date).toBe("20260719");
    expect(departures[4]!.departure.planned).toBe("11:21");
    expect(departures[4]!.departure.live).toBe("11:21");
    expect(departures[4]!.departure.inTime).toBe(true);

    expect(departures[5]!.stop.gid).toBe("de:09162:6");
    expect(departures[5]!.line.name).toBe("U4");
    expect(departures[5]!.line.symbol).toBe("010U4.svg");
    expect(departures[5]!.line.destination).toBe("Arabellapark");
    expect(departures[5]!.line.mvvApiId).toBe("swm:010U4:G:H:016");
    expect(departures[5]!.departure.date).toBe("20260719");
    expect(departures[5]!.departure.planned).toBe("11:21");
    expect(departures[5]!.departure.live).toBe("11:21");
    expect(departures[5]!.departure.inTime).toBe(true);

    expect(departures[6]!.stop.gid).toBe("de:09162:6");
    expect(departures[6]!.line.name).toBe("18");
    expect(departures[6]!.line.symbol).toBe("02018.svg");
    expect(departures[6]!.line.destination).toBe("Gondrellplatz");
    expect(departures[6]!.line.mvvApiId).toBe("swm:02018:G:R:016");
    expect(departures[6]!.departure.date).toBe("20260719");
    expect(departures[6]!.departure.planned).toBe("11:21");
    expect(departures[6]!.departure.live).toBe("11:21");
    expect(departures[6]!.departure.inTime).toBe(true);

    expect(departures[7]!.stop.gid).toBe("de:09162:6");
    expect(departures[7]!.line.name).toBe("U2");
    expect(departures[7]!.line.symbol).toBe("010U2.svg");
    expect(departures[7]!.line.destination).toBe("Messestadt Ost");
    expect(departures[7]!.line.mvvApiId).toBe("swm:010U2:G:H:016");
    expect(departures[7]!.departure.date).toBe("20260719");
    expect(departures[7]!.departure.planned).toBe("11:22");
    expect(departures[7]!.departure.live).toBe("11:22");
    expect(departures[7]!.departure.inTime).toBe(true);

    expect(departures[8]!.stop.gid).toBe("de:09162:6");
    expect(departures[8]!.line.name).toBe("20");
    expect(departures[8]!.line.symbol).toBe("02020.svg");
    expect(departures[8]!.line.destination).toBe("Moosach Bf.");
    expect(departures[8]!.line.mvvApiId).toBe("swm:02020:G:R:016");
    expect(departures[8]!.departure.date).toBe("20260719");
    expect(departures[8]!.departure.planned).toBe("11:23");
    expect(departures[8]!.departure.live).toBe("11:23");
    expect(departures[8]!.departure.inTime).toBe(true);

    expect(departures[9]!.stop.gid).toBe("de:09162:6");
    expect(departures[9]!.line.name).toBe("U4");
    expect(departures[9]!.line.symbol).toBe("010U4.svg");
    expect(departures[9]!.line.destination).toBe("Theresienwiese");
    expect(departures[9]!.line.mvvApiId).toBe("swm:010U4:G:R:016");
    expect(departures[9]!.departure.date).toBe("20260719");
    expect(departures[9]!.departure.planned).toBe("11:23");
    expect(departures[9]!.departure.live).toBe("11:23");
    expect(departures[9]!.departure.inTime).toBe(true);

    expect(departures[10]!.stop.gid).toBe("de:09162:6");
    expect(departures[10]!.line.name).toBe("U5");
    expect(departures[10]!.line.symbol).toBe("010U5.svg");
    expect(departures[10]!.line.destination).toBe("Neuperlach Süd");
    expect(departures[10]!.line.mvvApiId).toBe("swm:010U5:G:H:016");
    expect(departures[10]!.departure.date).toBe("20260719");
    expect(departures[10]!.departure.planned).toBe("11:24");
    expect(departures[10]!.departure.live).toBe("11:24");
    expect(departures[10]!.departure.inTime).toBe(true);

    expect(departures[11]!.stop.gid).toBe("de:09162:6");
    expect(departures[11]!.line.name).toBe("19");
    expect(departures[11]!.line.symbol).toBe("02019.svg");
    expect(departures[11]!.line.destination).toBe("Berg am Laim Bf.");
    expect(departures[11]!.line.mvvApiId).toBe("swm:02019:G:H:016");
    expect(departures[11]!.departure.date).toBe("20260719");
    expect(departures[11]!.departure.planned).toBe("11:24");
    expect(departures[11]!.departure.live).toBe("11:24");
    expect(departures[11]!.departure.inTime).toBe(true);

    expect(departures[12]!.stop.gid).toBe("de:09162:6");
    expect(departures[12]!.line.name).toBe("18");
    expect(departures[12]!.line.symbol).toBe("02018.svg");
    expect(departures[12]!.line.destination).toBe("Hochschule München");
    expect(departures[12]!.line.mvvApiId).toBe("swm:02018:G:H:016");
    expect(departures[12]!.departure.date).toBe("20260719");
    expect(departures[12]!.departure.planned).toBe("11:26");
    expect(departures[12]!.departure.live).toBe("11:26");
    expect(departures[12]!.departure.inTime).toBe(true);

    expect(departures[13]!.stop.gid).toBe("de:09162:6");
    expect(departures[13]!.line.name).toBe("U5");
    expect(departures[13]!.line.symbol).toBe("010U5.svg");
    expect(departures[13]!.line.destination).toBe("Laimer Platz");
    expect(departures[13]!.line.mvvApiId).toBe("swm:010U5:G:R:016");
    expect(departures[13]!.departure.date).toBe("20260719");
    expect(departures[13]!.departure.planned).toBe("11:26");
    expect(departures[13]!.departure.live).toBe("11:26");
    expect(departures[13]!.departure.inTime).toBe(true);

    expect(departures[14]!.stop.gid).toBe("de:09162:6");
    expect(departures[14]!.line.name).toBe("19");
    expect(departures[14]!.line.symbol).toBe("02019.svg");
    expect(departures[14]!.line.destination).toBe("Pasing Bf.");
    expect(departures[14]!.line.mvvApiId).toBe("swm:02019:G:R:016");
    expect(departures[14]!.departure.date).toBe("20260719");
    expect(departures[14]!.departure.planned).toBe("11:27");
    expect(departures[14]!.departure.live).toBe("11:27");
    expect(departures[14]!.departure.inTime).toBe(true);

    expect(departures[15]!.stop.gid).toBe("de:09162:6");
    expect(departures[15]!.line.name).toBe("U1");
    expect(departures[15]!.line.symbol).toBe("010U1.svg");
    expect(departures[15]!.line.destination).toBe("Mangfallplatz");
    expect(departures[15]!.line.mvvApiId).toBe("swm:010U1:G:H:016");
    expect(departures[15]!.departure.date).toBe("20260719");
    expect(departures[15]!.departure.planned).toBe("11:27");
    expect(departures[15]!.departure.live).toBe("11:27");
    expect(departures[15]!.departure.inTime).toBe(true);

    expect(departures[16]!.stop.gid).toBe("de:09162:6");
    expect(departures[16]!.line.name).toBe("U2");
    expect(departures[16]!.line.symbol).toBe("010U2.svg");
    expect(departures[16]!.line.destination).toBe("Feldmoching");
    expect(departures[16]!.line.mvvApiId).toBe("swm:010U2:G:R:016");
    expect(departures[16]!.departure.date).toBe("20260719");
    expect(departures[16]!.departure.planned).toBe("11:28");
    expect(departures[16]!.departure.live).toBe("11:28");
    expect(departures[16]!.departure.inTime).toBe(true);

    expect(departures[17]!.stop.gid).toBe("de:09162:6");
    expect(departures[17]!.line.name).toBe("U4");
    expect(departures[17]!.line.symbol).toBe("010U4.svg");
    expect(departures[17]!.line.destination).toBe("Arabellapark");
    expect(departures[17]!.line.mvvApiId).toBe("swm:010U4:G:H:016");
    expect(departures[17]!.departure.date).toBe("20260719");
    expect(departures[17]!.departure.planned).toBe("11:31");
    expect(departures[17]!.departure.live).toBe("11:31");
    expect(departures[17]!.departure.inTime).toBe(true);

    expect(departures[18]!.stop.gid).toBe("de:09162:6");
    expect(departures[18]!.line.name).toBe("18");
    expect(departures[18]!.line.symbol).toBe("02018.svg");
    expect(departures[18]!.line.destination).toBe("Gondrellplatz");
    expect(departures[18]!.line.mvvApiId).toBe("swm:02018:G:R:016");
    expect(departures[18]!.departure.date).toBe("20260719");
    expect(departures[18]!.departure.planned).toBe("11:31");
    expect(departures[18]!.departure.live).toBe("11:31");
    expect(departures[18]!.departure.inTime).toBe(true);

    expect(departures[19]!.stop.gid).toBe("de:09162:6");
    expect(departures[19]!.line.name).toBe("U1");
    expect(departures[19]!.line.symbol).toBe("010U1.svg");
    expect(departures[19]!.line.destination).toBe("Gern");
    expect(departures[19]!.line.mvvApiId).toBe("swm:010U1:G:R:016");
    expect(departures[19]!.departure.date).toBe("20260719");
    expect(departures[19]!.departure.planned).toBe("11:31");
    expect(departures[19]!.departure.live).toBe("11:31");
    expect(departures[19]!.departure.inTime).toBe(true);

    expect(departures[20]!.stop.gid).toBe("de:09162:6");
    expect(departures[20]!.line.name).toBe("U2");
    expect(departures[20]!.line.symbol).toBe("010U2.svg");
    expect(departures[20]!.line.destination).toBe("Messestadt Ost");
    expect(departures[20]!.line.mvvApiId).toBe("swm:010U2:G:H:016");
    expect(departures[20]!.departure.date).toBe("20260719");
    expect(departures[20]!.departure.planned).toBe("11:32");
    expect(departures[20]!.departure.live).toBe("11:32");
    expect(departures[20]!.departure.inTime).toBe(true);

    expect(departures[21]!.stop.gid).toBe("de:09162:6");
    expect(departures[21]!.line.name).toBe("20");
    expect(departures[21]!.line.symbol).toBe("02020.svg");
    expect(departures[21]!.line.destination).toBe("Moosach Bf.");
    expect(departures[21]!.line.mvvApiId).toBe("swm:02020:G:R:016");
    expect(departures[21]!.departure.date).toBe("20260719");
    expect(departures[21]!.departure.planned).toBe("11:33");
    expect(departures[21]!.departure.live).toBe("11:33");
    expect(departures[21]!.departure.inTime).toBe(true);

    expect(departures[22]!.stop.gid).toBe("de:09162:6");
    expect(departures[22]!.line.name).toBe("U4");
    expect(departures[22]!.line.symbol).toBe("010U4.svg");
    expect(departures[22]!.line.destination).toBe("Theresienwiese");
    expect(departures[22]!.line.mvvApiId).toBe("swm:010U4:G:R:016");
    expect(departures[22]!.departure.date).toBe("20260719");
    expect(departures[22]!.departure.planned).toBe("11:33");
    expect(departures[22]!.departure.live).toBe("11:32");
    expect(departures[22]!.departure.inTime).toBe(false);

    expect(departures[23]!.stop.gid).toBe("de:09162:6");
    expect(departures[23]!.line.name).toBe("19");
    expect(departures[23]!.line.symbol).toBe("02019.svg");
    expect(departures[23]!.line.destination).toBe("Berg am Laim Bf.");
    expect(departures[23]!.line.mvvApiId).toBe("swm:02019:G:H:016");
    expect(departures[23]!.departure.date).toBe("20260719");
    expect(departures[23]!.departure.planned).toBe("11:34");
    expect(departures[23]!.departure.live).toBe("11:34");
    expect(departures[23]!.departure.inTime).toBe(true);

    expect(departures[24]!.stop.gid).toBe("de:09162:6");
    expect(departures[24]!.line.name).toBe("U5");
    expect(departures[24]!.line.symbol).toBe("010U5.svg");
    expect(departures[24]!.line.destination).toBe("Neuperlach Süd");
    expect(departures[24]!.line.mvvApiId).toBe("swm:010U5:G:H:016");
    expect(departures[24]!.departure.date).toBe("20260719");
    expect(departures[24]!.departure.planned).toBe("11:34");
    expect(departures[24]!.departure.live).toBe("11:34");
    expect(departures[24]!.departure.inTime).toBe(true);

    expect(departures[25]!.stop.gid).toBe("de:09162:6");
    expect(departures[25]!.line.name).toBe("U5");
    expect(departures[25]!.line.symbol).toBe("010U5.svg");
    expect(departures[25]!.line.destination).toBe("Laimer Platz");
    expect(departures[25]!.line.mvvApiId).toBe("swm:010U5:G:R:016");
    expect(departures[25]!.departure.date).toBe("20260719");
    expect(departures[25]!.departure.planned).toBe("11:36");
    expect(departures[25]!.departure.live).toBe("11:36");
    expect(departures[25]!.departure.inTime).toBe(true);

    expect(departures[26]!.stop.gid).toBe("de:09162:6");
    expect(departures[26]!.line.name).toBe("18");
    expect(departures[26]!.line.symbol).toBe("02018.svg");
    expect(departures[26]!.line.destination).toBe("Hochschule München");
    expect(departures[26]!.line.mvvApiId).toBe("swm:02018:G:H:016");
    expect(departures[26]!.departure.date).toBe("20260719");
    expect(departures[26]!.departure.planned).toBe("11:36");
    expect(departures[26]!.departure.live).toBe("11:37");
    expect(departures[26]!.departure.inTime).toBe(false);

    expect(departures[27]!.stop.gid).toBe("de:09162:6");
    expect(departures[27]!.line.name).toBe("19");
    expect(departures[27]!.line.symbol).toBe("02019.svg");
    expect(departures[27]!.line.destination).toBe("Pasing Bf.");
    expect(departures[27]!.line.mvvApiId).toBe("swm:02019:G:R:016");
    expect(departures[27]!.departure.date).toBe("20260719");
    expect(departures[27]!.departure.planned).toBe("11:37");
    expect(departures[27]!.departure.live).toBe("11:37");
    expect(departures[27]!.departure.inTime).toBe(true);

    expect(departures[28]!.stop.gid).toBe("de:09162:6");
    expect(departures[28]!.line.name).toBe("U1");
    expect(departures[28]!.line.symbol).toBe("010U1.svg");
    expect(departures[28]!.line.destination).toBe("Mangfallplatz");
    expect(departures[28]!.line.mvvApiId).toBe("swm:010U1:G:H:016");
    expect(departures[28]!.departure.date).toBe("20260719");
    expect(departures[28]!.departure.planned).toBe("11:37");
    expect(departures[28]!.departure.live).toBe("11:37");
    expect(departures[28]!.departure.inTime).toBe(true);

    expect(departures[29]!.stop.gid).toBe("de:09162:6");
    expect(departures[29]!.line.name).toBe("U2");
    expect(departures[29]!.line.symbol).toBe("010U2.svg");
    expect(departures[29]!.line.destination).toBe("Feldmoching");
    expect(departures[29]!.line.mvvApiId).toBe("swm:010U2:G:R:016");
    expect(departures[29]!.departure.date).toBe("20260719");
    expect(departures[29]!.departure.planned).toBe("11:38");
    expect(departures[29]!.departure.live).toBe("11:38");
    expect(departures[29]!.departure.inTime).toBe(true);

    expect(departures[30]!.stop.gid).toBe("de:09162:6");
    expect(departures[30]!.line.name).toBe("U1");
    expect(departures[30]!.line.symbol).toBe("010U1.svg");
    expect(departures[30]!.line.destination).toBe("Gern");
    expect(departures[30]!.line.mvvApiId).toBe("swm:010U1:G:R:016");
    expect(departures[30]!.departure.date).toBe("20260719");
    expect(departures[30]!.departure.planned).toBe("11:41");
    expect(departures[30]!.departure.live).toBe("11:41");
    expect(departures[30]!.departure.inTime).toBe(true);

    expect(departures[31]!.stop.gid).toBe("de:09162:6");
    expect(departures[31]!.line.name).toBe("U4");
    expect(departures[31]!.line.symbol).toBe("010U4.svg");
    expect(departures[31]!.line.destination).toBe("Arabellapark");
    expect(departures[31]!.line.mvvApiId).toBe("swm:010U4:G:H:016");
    expect(departures[31]!.departure.date).toBe("20260719");
    expect(departures[31]!.departure.planned).toBe("11:41");
    expect(departures[31]!.departure.live).toBe("11:41");
    expect(departures[31]!.departure.inTime).toBe(true);

    expect(departures[32]!.stop.gid).toBe("de:09162:6");
    expect(departures[32]!.line.name).toBe("18");
    expect(departures[32]!.line.symbol).toBe("02018.svg");
    expect(departures[32]!.line.destination).toBe("Gondrellplatz");
    expect(departures[32]!.line.mvvApiId).toBe("swm:02018:G:R:016");
    expect(departures[32]!.departure.date).toBe("20260719");
    expect(departures[32]!.departure.planned).toBe("11:41");
    expect(departures[32]!.departure.live).toBe("11:41");
    expect(departures[32]!.departure.inTime).toBe(true);

    expect(departures[33]!.stop.gid).toBe("de:09162:6");
    expect(departures[33]!.line.name).toBe("U2");
    expect(departures[33]!.line.symbol).toBe("010U2.svg");
    expect(departures[33]!.line.destination).toBe("Messestadt Ost");
    expect(departures[33]!.line.mvvApiId).toBe("swm:010U2:G:H:016");
    expect(departures[33]!.departure.date).toBe("20260719");
    expect(departures[33]!.departure.planned).toBe("11:42");
    expect(departures[33]!.departure.live).toBe("11:42");
    expect(departures[33]!.departure.inTime).toBe(true);

    expect(departures[34]!.stop.gid).toBe("de:09162:6");
    expect(departures[34]!.line.name).toBe("20");
    expect(departures[34]!.line.symbol).toBe("02020.svg");
    expect(departures[34]!.line.destination).toBe("Moosach Bf.");
    expect(departures[34]!.line.mvvApiId).toBe("swm:02020:G:R:016");
    expect(departures[34]!.departure.date).toBe("20260719");
    expect(departures[34]!.departure.planned).toBe("11:43");
    expect(departures[34]!.departure.live).toBe("11:43");
    expect(departures[34]!.departure.inTime).toBe(true);

    expect(departures[35]!.stop.gid).toBe("de:09162:6");
    expect(departures[35]!.line.name).toBe("U4");
    expect(departures[35]!.line.symbol).toBe("010U4.svg");
    expect(departures[35]!.line.destination).toBe("Theresienwiese");
    expect(departures[35]!.line.mvvApiId).toBe("swm:010U4:G:R:016");
    expect(departures[35]!.departure.date).toBe("20260719");
    expect(departures[35]!.departure.planned).toBe("11:43");
    expect(departures[35]!.departure.live).toBe("11:43");
    expect(departures[35]!.departure.inTime).toBe(true);

    expect(departures[36]!.stop.gid).toBe("de:09162:6");
    expect(departures[36]!.line.name).toBe("19");
    expect(departures[36]!.line.symbol).toBe("02019.svg");
    expect(departures[36]!.line.destination).toBe("Berg am Laim Bf.");
    expect(departures[36]!.line.mvvApiId).toBe("swm:02019:G:H:016");
    expect(departures[36]!.departure.date).toBe("20260719");
    expect(departures[36]!.departure.planned).toBe("11:44");
    expect(departures[36]!.departure.live).toBe("11:44");
    expect(departures[36]!.departure.inTime).toBe(true);

    expect(departures[37]!.stop.gid).toBe("de:09162:6");
    expect(departures[37]!.line.name).toBe("U5");
    expect(departures[37]!.line.symbol).toBe("010U5.svg");
    expect(departures[37]!.line.destination).toBe("Neuperlach Süd");
    expect(departures[37]!.line.mvvApiId).toBe("swm:010U5:G:H:016");
    expect(departures[37]!.departure.date).toBe("20260719");
    expect(departures[37]!.departure.planned).toBe("11:44");
    expect(departures[37]!.departure.live).toBe("11:44");
    expect(departures[37]!.departure.inTime).toBe(true);

    expect(departures[38]!.stop.gid).toBe("de:09162:6");
    expect(departures[38]!.line.name).toBe("18");
    expect(departures[38]!.line.symbol).toBe("02018.svg");
    expect(departures[38]!.line.destination).toBe("Hochschule München");
    expect(departures[38]!.line.mvvApiId).toBe("swm:02018:G:H:016");
    expect(departures[38]!.departure.date).toBe("20260719");
    expect(departures[38]!.departure.planned).toBe("11:46");
    expect(departures[38]!.departure.live).toBe("11:46");
    expect(departures[38]!.departure.inTime).toBe(true);

    expect(departures[39]!.stop.gid).toBe("de:09162:6");
    expect(departures[39]!.line.name).toBe("U5");
    expect(departures[39]!.line.symbol).toBe("010U5.svg");
    expect(departures[39]!.line.destination).toBe("Laimer Platz");
    expect(departures[39]!.line.mvvApiId).toBe("swm:010U5:G:R:016");
    expect(departures[39]!.departure.date).toBe("20260719");
    expect(departures[39]!.departure.planned).toBe("11:46");
    expect(departures[39]!.departure.live).toBe("11:46");
    expect(departures[39]!.departure.inTime).toBe(true);
});
