export class MVVRequestFailure extends Error {
    constructor(e: any) {
        const m = e instanceof Error ? (e as Error).message : `${e}`;
        super(m);
    }
}

export interface IFetchResult {
    json(): Promise<any>;
}

export interface IFetcher {
    fetch(url: string): Promise<IFetchResult>;
}
