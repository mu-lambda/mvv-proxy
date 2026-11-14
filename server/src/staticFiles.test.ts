import * as fs from "node:fs/promises";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import * as os from "node:os";
import * as path from "node:path";
import express from "express";
import { testing as harness } from "shared";

import { CACHE, StaticFiles, notFound } from "./staticFiles.ts";

const { suite, testAsync, expect } = harness;

/**
 * A site of `www` files (name → content) under "/" and `fonts` under
 * "/fonts", served as server.ts does.
 */
async function withSite(
    www: Record<string, string>,
    fonts: Record<string, string>,
    body: (base: string, files: StaticFiles, dir: string) => Promise<void>,
): Promise<void> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "static-files-"));
    try {
        for (const [sub, contents] of [
            ["www", www],
            ["fonts", fonts],
        ] as const) {
            for (const [name, content] of Object.entries(contents)) {
                const file = path.join(dir, sub, name);
                await fs.mkdir(path.dirname(file), { recursive: true });
                await fs.writeFile(file, content);
            }
        }
        const files = await StaticFiles.load({
            "/": path.join(dir, "www"),
            "/fonts": path.join(dir, "fonts"),
        });
        const app = express();
        app.use(files.router());
        app.use(notFound);
        const server = app.listen(0, "127.0.0.1");
        await new Promise<void>((r) => server.once("listening", () => r()));
        const { port } = server.address() as AddressInfo;
        try {
            await body(`http://127.0.0.1:${port}`, files, dir);
        } finally {
            server.closeAllConnections();
            server.close();
        }
    } finally {
        await fs.rm(dir, { recursive: true });
    }
}

/**
 * The status of a GET with these headers. Not fetch: it adds
 * "Cache-Control: no-cache" to a request with If-None-Match, which asks
 * for the whole file again.
 */
function statusOf(
    url: string,
    headers: Record<string, string>,
): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
        http.get(url, { headers }, (res) => {
            res.resume();
            resolve(res.statusCode);
        }).on("error", reject);
    });
}

const SITE = {
    "index.css": "body { color: red; }",
    "out/index-bundle.js": "console.log(1);",
    "pin.svg": "<svg/>",
};
const FONTS = { "librefranklin/font.ttf": "glyphs" };

const tests = [
    testAsync("a versioned URL is kept for a year", () =>
        withSite(SITE, FONTS, async (base, files) => {
            const url = files.url("/out/index-bundle.js");
            expect(url.startsWith("/out/index-bundle.js?v=")).toBe(true);
            const res = await fetch(base + url);
            expect(res.status).toBe(200);
            expect(await res.text()).toBe("console.log(1);");
            expect(res.headers.get("cache-control")).toBe(CACHE.versioned);
        }),
    ),

    testAsync("code without its version is always checked", () =>
        withSite(SITE, FONTS, async (base) => {
            for (const url of ["/index.css", "/index.css?v=0123456789ab"]) {
                const res = await fetch(base + url);
                expect(res.status).toBe(200);
                expect(res.headers.get("cache-control")).toBe(CACHE.code);
            }
        }),
    ),

    testAsync("pictures and fonts are kept for a day", () =>
        withSite(SITE, FONTS, async (base) => {
            for (const url of ["/pin.svg", "/fonts/librefranklin/font.ttf"]) {
                const res = await fetch(base + url);
                expect(res.status).toBe(200);
                expect(res.headers.get("cache-control")).toBe(CACHE.other);
            }
        }),
    ),

    testAsync("the ETag answers a recheck with a 304", () =>
        withSite(SITE, FONTS, async (base, files) => {
            const first = await fetch(base + "/index.css");
            const etag = first.headers.get("etag");
            // The content's hash, as in the versioned URL.
            const version = files.url("/index.css").split("?v=")[1];
            expect(etag).toBe(`"${version}"`);
            expect(first.headers.get("last-modified")).toBe(null);
            expect(
                await statusOf(base + "/index.css", { "If-None-Match": etag! }),
            ).toBe(304);
            // A browser's reload asks for the whole file.
            expect(
                await statusOf(base + "/index.css", {
                    "If-None-Match": etag!,
                    "Cache-Control": "no-cache",
                }),
            ).toBe(200);
        }),
    ),

    testAsync("a change of the same size is a new ETag and URL", async () => {
        let before = { etag: "", url: "" };
        let after = { etag: "", url: "" };
        await withSite(SITE, FONTS, async (base, files) => {
            const res = await fetch(base + "/index.css");
            before = {
                etag: res.headers.get("etag")!,
                url: files.url("/index.css"),
            };
        });
        const changed = { ...SITE, "index.css": "body { color: tan; }" };
        expect(changed["index.css"].length).toBe(SITE["index.css"].length);
        await withSite(changed, FONTS, async (base, files) => {
            const res = await fetch(base + "/index.css");
            after = {
                etag: res.headers.get("etag")!,
                url: files.url("/index.css"),
            };
        });
        expect(after.etag).toNotBe(before.etag);
        expect(after.url).toNotBe(before.url);
    }),

    testAsync("files reached through symlinks are hashed", () =>
        withSite(SITE, FONTS, async (_, __, dir) => {
            // Bazel's runfiles are symlinks.
            await fs.symlink(
                path.join(dir, "www", "pin.svg"),
                path.join(dir, "www", "linked.svg"),
            );
            const files = await StaticFiles.load({
                "/": path.join(dir, "www"),
            });
            expect(files.url("/linked.svg")).toBe(
                files.url("/pin.svg").replace("pin", "linked"),
            );
        }),
    ),

    testAsync("files are read once, when the server starts", () =>
        withSite(SITE, FONTS, async (base, files, dir) => {
            const before = files.url("/index.css");
            await fs.writeFile(path.join(dir, "www", "index.css"), "changed");
            const res = await fetch(base + "/index.css");
            expect(await res.text()).toBe(SITE["index.css"]);
            expect(files.url("/index.css")).toBe(before);
        }),
    ),

    testAsync("each file says its type, and HEAD sends no body", () =>
        withSite(SITE, FONTS, async (base) => {
            for (const [url, type] of [
                ["/index.css", "text/css; charset=utf-8"],
                ["/out/index-bundle.js", "text/javascript; charset=utf-8"],
                ["/pin.svg", "image/svg+xml"],
                ["/fonts/librefranklin/font.ttf", "font/ttf"],
            ]) {
                const res = await fetch(base + url!);
                expect(res.headers.get("content-type")).toBe(type!);
            }
            const head = await fetch(base + "/index.css", { method: "HEAD" });
            expect(head.status).toBe(200);
            expect(head.headers.get("etag")).toNotBe(null);
            expect(await head.text()).toBe("");
        }),
    ),

    testAsync("a page added in memory is served like a file", () =>
        withSite(SITE, FONTS, async (base, files) => {
            files.add("/impressum", "<p>Impressum</p>", "html");
            const url = files.url("/impressum");
            expect(url.startsWith("/impressum?v=")).toBe(true);
            const versioned = await fetch(base + url);
            expect(await versioned.text()).toBe("<p>Impressum</p>");
            expect(versioned.headers.get("content-type")).toBe(
                "text/html; charset=utf-8",
            );
            expect(versioned.headers.get("cache-control")).toBe(
                CACHE.versioned,
            );
            const plain = await fetch(base + "/impressum");
            expect(plain.headers.get("cache-control")).toBe(CACHE.code);
            expect(plain.headers.get("etag")).toBe(`"${url.split("?v=")[1]}"`);
        }),
    ),

    testAsync("a missing file is a 404 nobody keeps", () =>
        withSite(SITE, FONTS, async (base, files) => {
            expect(files.url("/missing.js")).toBe("/missing.js");
            const res = await fetch(base + "/missing.js");
            expect(res.status).toBe(404);
            expect(res.headers.get("cache-control")).toBe(CACHE.notFound);
        }),
    ),
];

async function run() {
    if (!(await suite(...tests))) process.exitCode = 1;
}

run();
