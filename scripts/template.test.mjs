import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { render, renderFile } from "./template.mjs";

test("values are HTML-escaped", () => {
    assert.equal(render("<p>{{ site.name }}</p>", { site: { name: "A & <B>" } }), "<p>A &amp; &lt;B&gt;</p>");
});

test("unknown values fail loudly", () => {
    assert.throws(() => render("{{ site.nmae }}", { site: { name: "x" } }), /unknown value "site.nmae"/);
});

test("@each repeats with the loop variable, including nested loops", () => {
    const html = render(
        "<!-- @each p in projects --><b>{{p.title}}</b><!-- @each t in p.tags --><i>{{t}}</i><!-- @end --><!-- @end -->",
        { projects: [{ title: "One", tags: ["a", "b"] }, { title: "Two", tags: [] }] },
    );
    assert.equal(html, "<b>One</b><i>a</i><i>b</i><b>Two</b>");
});

test("@if / @else treat missing optional fields as false", () => {
    const template = "<!-- @each u in updates --><!-- @if u.href --><a href=\"{{u.href}}\">{{u.title}}</a><!-- @else --><p>{{u.title}}</p><!-- @end --><!-- @end -->";
    assert.equal(render(template, { updates: [{ title: "Link", href: "x/" }, { title: "Plain" }] }), '<a href="x/">Link</a><p>Plain</p>');
});

test("unbalanced blocks are rejected", () => {
    assert.throws(() => render("<!-- @each x in xs -->", { xs: [] }), /missing @end/);
    assert.throws(() => render("<!-- @end -->", {}), /@end without/);
});

test("@include renders files relative to the root and detects cycles", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "opsnest-template-"));
    fs.mkdirSync(path.join(root, "components"));
    fs.writeFileSync(path.join(root, "components/card.html"), "<h3>{{ card.title }}</h3>");
    fs.writeFileSync(path.join(root, "page.html"), "<!-- @each card in cards --><!-- @include components/card.html --><!-- @end -->");
    fs.writeFileSync(path.join(root, "loop.html"), "<!-- @include loop.html -->");
    assert.equal(renderFile("page.html", { cards: [{ title: "A" }, { title: "B" }] }, { root }), "<h3>A</h3><h3>B</h3>");
    assert.throws(() => renderFile("loop.html", {}, { root }), /Include cycle/);
    assert.throws(() => renderFile("missing.html", {}, { root }), /include not found/);
});
