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

/** Types that link other files, so are always checked without a version. */
const CODE = new Set(["html", "css", "js"]);

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

type Entry = {
    content: Buffer;
    /** The start of the content's SHA-256: the ETag and the version. */
    hash: string;
    /** For Content-Type, as Express's `res.type` takes it ("css", "html"). */
    type: string;
};

/**
 * Static files, and pages written when the server starts, served from
 * memory with an ETag from their content and a version for their URLs.
 *
 * Express's own ETag is the size and the modification time, and every file
 * in the Docker image is dated 1970: a changed file of the same size would
 * be "not modified" forever. So the files are read and hashed when the
 * server starts, and served from what was read. All of them come to about
 * 2 MB. A file changed on disk after the start is not seen until a restart.
 */
export class StaticFiles {
    /** URL path ("/out/index-bundle.js") → the file. */
    readonly #entries = new Map<string, Entry>();

    private constructor() {}

    /** `dirs` maps a URL prefix ("/", "/fonts") to the directory it serves. */
    static async load(dirs: Record<string, string>): Promise<StaticFiles> {
        const files = new StaticFiles();
        for (const [prefix, dir] of Object.entries(dirs)) {
            for await (const file of filesUnder(dir)) {
                const relative = path
                    .relative(dir, file)
                    .split(path.sep)
                    .join("/");
                files.#put(
                    path.posix.join("/", prefix, relative),
                    await fs.readFile(file),
                    path.extname(file).slice(1),
                );
            }
        }
        return files;
    }

    /**
     * Serves `content` at `urlPath` like a file, such as a page the server
     * writes once (the Impressum): `type` is for Content-Type ("html").
     */
    add(urlPath: string, content: string, type: string) {
        this.#put(urlPath, Buffer.from(content), type);
    }

    #put(urlPath: string, content: Buffer, type: string) {
        this.#entries.set(urlPath, { content, hash: hashOf(content), type });
    }

    /**
     * `urlPath` with its version, such as "/index.css?v=3f9a1c2b4d5e": cached
     * for a year, and a new URL when the file changes. A path that isn't
     * served here is returned as it is.
     */
    url(urlPath: string): string {
        const entry = this.#entries.get(urlPath);
        return entry === undefined ? urlPath : `${urlPath}?v=${entry.hash}`;
    }

    /** Serves the files, with an ETag and Cache-Control for each. */
    router(): express.Router {
        const router = express.Router();
        router.use((req, res, next) => {
            const entry = this.#entries.get(req.path);
            if (entry === undefined || !["GET", "HEAD"].includes(req.method)) {
                next();
                return;
            }
            res.setHeader("ETag", `"${entry.hash}"`);
            res.setHeader(
                "Cache-Control",
                req.query.v === entry.hash
                    ? CACHE.versioned
                    : CODE.has(entry.type)
                      ? CACHE.code
                      : CACHE.other,
            );
            // With the ETag set, send answers a matching If-None-Match with
            // a 304, and a HEAD without the body.
            res.type(entry.type).send(entry.content);
        });
        return router;
    }
}

/** The last handler: a 404 that nobody keeps. */
export function notFound(_: express.Request, res: express.Response) {
    res.setHeader("Cache-Control", CACHE.notFound);
    res.status(404).type("text").send("Not found");
}
