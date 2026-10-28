/*
=========================================
Local preview: builds into dist/, serves it, and rebuilds on every change.
=========================================

  npm run dev          ->  http://localhost:8080
  PORT=3000 npm run dev
*/

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { ROOT, build } from "./build.mjs";

const PORT = Number(process.env.PORT ?? 8080);
const OUT = path.join(ROOT, "dist");
const WATCH = ["index.html", "components", "css", "data", "js", "assets"];
const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".xml": "application/xml",
    ".txt": "text/plain; charset=utf-8",
};

function rebuild() {
    try {
        build(OUT);
        console.log(`[${new Date().toLocaleTimeString()}] rebuilt`);
    } catch (error) {
        // Keep serving the last good build; the error says what to fix.
        console.error(`[${new Date().toLocaleTimeString()}] build failed: ${error.message}`);
    }
}

rebuild();

let timer;
for (const entry of WATCH) {
    fs.watch(path.join(ROOT, entry), { recursive: true }, () => {
        clearTimeout(timer);
        timer = setTimeout(rebuild, 100);
    });
}

http.createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let file = path.join(OUT, urlPath);
    if (file !== OUT && !file.startsWith(OUT + path.sep)) {
        response.writeHead(403).end();
        return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) {
        response.writeHead(404, { "Content-Type": "text/plain" }).end("Not found (learn/ and blog/ are separate apps; run them from their own repositories)");
        return;
    }
    response.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
}).listen(PORT, () => console.log(`OpsNest preview: http://localhost:${PORT}`));
