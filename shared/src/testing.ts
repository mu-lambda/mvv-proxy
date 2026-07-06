export class Test {
    #name: string;
    #callback: () => Promise<void>;

    constructor(name: string, callback: () => Promise<void>) {
        this.#name = name;
        this.#callback = callback;
    }

    async run(): Promise<boolean> {
        try {
            console.log(`Testing ${this.#name}`);
            await this.#callback();
            console.log("Passed");
            return true;
        } catch (e) {
            console.log(`${this.#name} failed: ${e}`);
            console.log((e as Error).stack);
            return false;
        }
    }
}

export function test(name: string, callback: () => void): Test {
    return new Test(name, async () => {
        callback();
    });
}

export function testAsync(name: string, callback: () => Promise<void>): Test {
    return new Test(name, callback);
}

export async function suite(...tests: Test[]): Promise<boolean> {
    let success = true;
    for (const t of tests) {
        if (!(await t.run())) {
            success = false;
        }
    }
    return success;
}

type Matchers<T> = {
    toBeLessThanOrEqual: (expected: T) => void;
    toBe: (expected: T) => void;
    toNotBe: (expected: T) => void;
    toBeIn: (set: Set<T>) => void;
    toNotBeIn: (set: Set<T>) => void;
    toBeDefined: () => void;
};

export function expect<T>(value: T): Matchers<T> {
    return {
        toBeLessThanOrEqual: (expected: T) => {
            if (value > expected) {
                throw new Error(`Expected ${value} <= ${expected}`);
            }
        },

        toBe: (expected: T) => {
            if (value !== expected) {
                throw new Error(`Expected ${expected}, found ${value}`);
            }
        },

        toNotBe: (expected: T) => {
            if (value === expected) {
                throw new Error(`Expected ${expected} to not be ${value}`);
            }
        },

        toBeIn(set: Set<T>) {
            if (!set.has(value)) {
                throw new Error(`${JSON.stringify(value)} not found`);
            }
        },

        toNotBeIn(set: Set<T>) {
            if (set.has(value)) {
                throw new Error(`${value} found`);
            }
        },

        toBeDefined: () => {
            if (value === undefined) throw new Error("Expected defined");
        },
    };
}
