/*
=========================================
OpsNest site build
=========================================

  node scripts/build.mjs [outDir]     (default: dist)

1. Loads every data/*.json file (data/blog-topics.json -> blogTopics).
2. Renders index.html and its components/ includes.
3. Bundles css/style.css and its @imports into a single stylesheet.
4. Copies the static files listed in STATIC_FILES.

Only what is listed here is published, so sources (components/, data/,
scripts/, docs) never end up on the live site.
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderFile } from "./template.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATIC_FILES = ["assets", "js", "CNAME", "robots.txt", "sitemap.xml"];
const STYLESHEET = "css/style.css";

function camelCase(name) {
    return name.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
}

export function loadData() {
    const data = {};
    for (const file of fs.readdirSync(path.join(ROOT, "data")).filter((name) => name.endsWith(".json")).sort()) {
        try {
            data[camelCase(path.basename(file, ".json"))] = JSON.parse(fs.readFileSync(path.join(ROOT, "data", file), "utf8"));
        } catch (error) {
            throw new Error(`data/${file}: ${error.message}`);
        }
    }
    return data;
}

/** Inlines `@import "x.css";` rules (recursively) so the browser downloads one stylesheet. */
export function bundleCss(file, seen = new Set()) {
    const absolute = path.join(ROOT, file);
    if (seen.has(absolute)) throw new Error(`CSS import cycle at ${file}`);
    seen.add(absolute);
    if (!fs.existsSync(absolute)) throw new Error(`CSS import not found: ${file}`);
    return fs.readFileSync(absolute, "utf8").replace(
        /@import\s+(?:url\()?["']([^"']+)["']\)?\s*;/g,
        (_, target) => `/* ${target} */\n` + bundleCss(path.join(path.dirname(file), target), seen),
    );
}

export function build(outDir = path.join(ROOT, "dist")) {
    const html = renderFile("index.html", loadData(), { root: ROOT });
    const leftover = html.match(/\{\{|<!--\s*@\w+/);
    if (leftover) throw new Error(`index.html: unrendered template syntax near "${html.slice(leftover.index, leftover.index + 60)}"`);

    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(outDir, path.dirname(STYLESHEET)), { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html);
    fs.writeFileSync(path.join(outDir, STYLESHEET), bundleCss(STYLESHEET));
    for (const entry of STATIC_FILES) {
        fs.cpSync(path.join(ROOT, entry), path.join(outDir, entry), { recursive: true });
    }
    return outDir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const outDir = build(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
    console.log(`Built OpsNest site into ${path.relative(process.cwd(), outDir) || "."}/`);
}
