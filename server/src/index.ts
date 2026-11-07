// Public library surface of the server package (imported as "mvv-proxy" by the
// //tests package). The server app itself boots from main.ts, not this barrel.
export { lines } from "./lines.ts";
export * as data from "./data.ts";
export { ProxyFetcher } from "./proxyFetcher.ts";
