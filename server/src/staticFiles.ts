import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import express from "express";

/**
 * How long browsers (and Cloudflare) keep each kind of static file.
 *
 * A URL with the file's own version (`?v=`, see `StaticFiles.url`) never
 * changes content, so it's kept for a year. The page links its script and
 * styles that way, and the page itself is checked on every load, so a
 * deploy reaches everyone on their next visit.
 */
export const CACHE = {
    versioned: "public, max-age=31536000, immutable",
    /** Code without a version: it links other files, so always check. */
    code: "no-cache",
    /** Pictures and fonts, which rarely change. */
    other: "public, max-age=86400",
    /** So Cloudflare doesn't keep a 404 for hours. */
    notFound: "no-store",
};

const CODE = new Set([".html", ".css", ".js"]);

/** The first 12 hex digits of the content's SHA-256. */
function hashOf(content: Buffer): string {
    return crypto
        .createHash("sha256")
        .update(content)
        .digest("hex")
        .slice(0, 12);
}

/** Every file under `dir`, following symlinks (as in Bazel's runfiles). */
async function* filesUnder(dir: string): AsyncGenerator<string> {
    for (const name of await fs.readdir(dir)) {
        const file = path.join(dir, name);
        const stat = await fs.stat(file);
        if (stat.isDirectory()) {
            yield* filesUnder(file);
        } else if (stat.isFile()) {
            yield file;
        }
    }
}

/**
 * Static files, served with an ETag from their content and a version for
 * their URLs.
 *
 * Express's own ETag is the size and the modification time, and every file
 * in the Docker image is dated 1970: a changed file of the same size would
 * be "not modified" forever. So the files are hashed when the server starts.
 */
export class StaticFiles {
    /** URL path ("/out/index-bundle.js") → hash of the file's content. */
    readonly #hashes: Map<string, string>;
    readonly #dirs: [string, string][];

    private constructor(hashes: Map<string, string>, dirs: [string, string][]) {
        this.#hashes = hashes;
        this.#dirs = dirs;
    }

    /** `dirs` maps a URL prefix ("/", "/fonts") to the directory it serves. */
    static async load(dirs: Record<string, string>): Promise<StaticFiles> {
        const hashes = new Map<string, string>();
        for (const [prefix, dir] of Object.entries(dirs)) {
            for await (const file of filesUnder(dir)) {
                const relative = path
                    .relative(dir, file)
                    .split(path.sep)
                    .join("/");
                const url = path.posix.join("/", prefix, relative);
                hashes.set(url, hashOf(await fs.readFile(file)));
            }
        }
        return new StaticFiles(hashes, Object.entries(dirs));
    }

    /**
     * `urlPath` with its version, such as "/index.css?v=3f9a1c2b4d5e": cached
     * for a year, and a new URL when the file changes. A path that isn't a
     * static file is returned as it is.
     */
    url(urlPath: string): string {
        const hash = this.#hashes.get(urlPath);
        return hash === undefined ? urlPath : `${urlPath}?v=${hash}`;
    }

    /** Serves the files, with an ETag and Cache-Control for each. */
    router(): express.Router {
        const router = express.Router();
        router.use((req, res, next) => {
            const hash = this.#hashes.get(req.path);
            if (hash !== undefined && ["GET", "HEAD"].includes(req.method)) {
                // Express answers If-None-Match with a 304 from this ETag.
                res.setHeader("ETag", `"${hash}"`);
                res.setHeader(
                    "Cache-Control",
                    req.query.v === hash
                        ? CACHE.versioned
                        : CODE.has(path.extname(req.path))
                          ? CACHE.code
                          : CACHE.other,
                );
            }
            next();
        });
        const options = {
            etag: false,
            lastModified: false,
            cacheControl: false,
        };
        for (const [prefix, dir] of this.#dirs) {
            router.use(prefix, express.static(dir, options));
        }
        return router;
    }
}

/** The last handler: a 404 that nobody keeps. */
export function notFound(_: express.Request, res: express.Response) {
    res.setHeader("Cache-Control", CACHE.notFound);
    res.status(404).type("text").send("Not found");
}
