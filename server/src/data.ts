import * as fs from "node:fs/promises";
import { info } from "shared";

export async function* loadStops(filename: string): AsyncGenerator<info.Stop> {
    const data: string = await fs.readFile(filename, { encoding: "utf-8" });
    const lines = data.split("\r\n");
    for (const line of lines) {
        const fields = line.split(";");
        if (fields.length < 5 || isNaN(+fields[0]!)) continue;
        let location = undefined;
        if (fields[4] != "" && fields[5] != "") {
            let latitude = +fields[4]!.replace(",", ".");
            let longitude = +fields[5]!.replace(",", ".");
            if (!isNaN(latitude) && !isNaN(longitude)) {
                location = { latitude, longitude };
            }
        }
        yield {
            id: +fields[0]!,
            name: fields[1]!,
            town: fields[2]!,
            gid: fields[3]!,
            location,
        };
    }
}
