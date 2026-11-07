export class MVVRequestFailure extends Error {
    /** The HTTP status MVV answered with; undefined if no reply arrived. */
    readonly status: number | undefined;

    constructor(e: any, status?: number) {
        const m = e instanceof Error ? (e as Error).message : `${e}`;
        super(m);
        this.status = status;
    }
}

export interface IFetchResult {
    json(): Promise<any>;
    text(): Promise<string>;
}

export interface IFetcher {
    fetch(url: string): Promise<IFetchResult>;
}
