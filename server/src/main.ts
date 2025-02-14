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
        if (e instanceof Error) {
            const error = e as Error;
            console.log(`Error ${error.message} @ ${error.stack}`);
        } else {
            console.log(`Error ${e}`);
        }
        process.exitCode = 1;
    }
}
main();
