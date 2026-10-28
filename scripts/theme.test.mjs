import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./build.mjs";

const css = fs.readFileSync(path.join(ROOT, "css/variables.css"), "utf8");

/** Declarations inside the first `{ ... }` after `selector`, as "prop:value" strings with whitespace removed. */
function declarations(selector) {
    const start = css.indexOf(selector);
    assert.notEqual(start, -1, `variables.css: ${selector} not found`);
    const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start)).replace(/\/\*[\s\S]*?\*\//g, "");
    return body.split(";").map((line) => line.replace(/\s+/g, "")).filter(Boolean);
}

test("both light theme blocks in variables.css declare the same values", () => {
    assert.deepEqual(declarations(':root:not([data-theme="dark"])'), declarations(':root[data-theme="light"]'));
});

test("the light theme only overrides tokens the dark default defines", () => {
    const defined = new Set(declarations(":root{").map((line) => line.split(":")[0]));
    for (const line of declarations(':root[data-theme="light"]')) {
        assert.ok(defined.has(line.split(":")[0]), `light theme sets ${line.split(":")[0]}, which :root does not define`);
    }
});
