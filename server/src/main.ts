import { exec } from "child_process";
import { server } from "./server";

async function notifyReady() {
    if (process.env.NOTIFY_SOCKET === undefined) return;
    exec(`systemd-notify --ready --pid=${process.pid.toString()}`);
}

async function main() {
    try {
        await server(() => notifyReady());
    } catch (e) {
        console.log(`Error ${e}`);
        process.exitCode = 1;
    }
}
main();
