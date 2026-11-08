import { testing as harness } from "shared";

import { Budget, Concurrency } from "./limits.ts";

const { suite, test, testAsync, expect } = harness;

const tests = [
    test("a budget allows a burst, then refills", () => {
        let now = 0;
        const b = new Budget(3, 1000, () => now);
        expect([b.take(), b.take(), b.take(), b.take()].join()).toBe(
            "true,true,true,false",
        );
        now += 999;
        expect(b.take()).toBe(false);
        now += 1;
        expect(b.take()).toBe(true);
        expect(b.take()).toBe(false);
    }),

    test("a budget refills to its burst and no further", () => {
        let now = 0;
        const b = new Budget(2, 1000, () => now);
        b.take();
        b.take();
        now += 60 * 1000;
        expect([b.take(), b.take(), b.take()].join()).toBe("true,true,false");
    }),

    testAsync("at most max tasks run at once, in order", async () => {
        const c = new Concurrency(2);
        let running = 0;
        let most = 0;
        const order: number[] = [];
        const release: (() => void)[] = [];
        const task = (i: number) =>
            c.run(async () => {
                running++;
                most = Math.max(most, running);
                order.push(i);
                await new Promise<void>((r) => release.push(r));
                running--;
                return i;
            });
        const all = Promise.all([0, 1, 2, 3, 4].map(task));
        // Let tasks start, then finish them one by one.
        for (let i = 0; i < 5; i++) {
            await new Promise((r) => setImmediate(r));
            release.shift()?.();
        }
        expect((await all).join()).toBe("0,1,2,3,4");
        expect(most).toBe(2);
        expect(order.join()).toBe("0,1,2,3,4");
    }),

    testAsync("a failed task gives its slot back", async () => {
        const c = new Concurrency(1);
        let failed = false;
        try {
            await c.run(async () => {
                throw new Error("boom");
            });
        } catch {
            failed = true;
        }
        expect(failed).toBe(true);
        expect(await c.run(async () => "next")).toBe("next");
    }),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
