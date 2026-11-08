/**
 * Limits on how the server asks MVV for things, so that clients can't make
 * it ask more than MVV would put up with.
 */

/**
 * A budget that refills over time: up to `burst` at once, then one more
 * every `refillMs`.
 */
export class Budget {
    readonly #burst: number;
    readonly #refillMs: number;
    readonly #now: () => number;
    #left: number;
    #at: number;

    /** `now` gives the time in milliseconds; tests replace it. */
    constructor(burst: number, refillMs: number, now: () => number) {
        this.#burst = burst;
        this.#refillMs = refillMs;
        this.#now = now;
        this.#left = burst;
        this.#at = now();
    }

    /** Spends one, if there is one left. */
    take(): boolean {
        const now = this.#now();
        this.#left = Math.min(
            this.#burst,
            this.#left + (now - this.#at) / this.#refillMs,
        );
        this.#at = now;
        if (this.#left < 1) {
            return false;
        }
        this.#left -= 1;
        return true;
    }
}

/** Runs at most `max` tasks at once; the rest wait their turn. */
export class Concurrency {
    readonly #max: number;
    #running = 0;
    readonly #waiting: (() => void)[] = [];

    constructor(max: number) {
        this.#max = max;
    }

    async run<T>(task: () => Promise<T>): Promise<T> {
        if (this.#running >= this.#max) {
            await new Promise<void>((r) => this.#waiting.push(r));
        } else {
            this.#running++;
        }
        try {
            return await task();
        } finally {
            // Hand the slot straight to the next task, or give it back.
            const next = this.#waiting.shift();
            if (next !== undefined) {
                next();
            } else {
                this.#running--;
            }
        }
    }
}
