/*
=========================================
Minimal HTML template engine (no dependencies)
=========================================

  {{ path.to.value }}              escaped value from data/*.json or a loop variable
  <!-- @include components/x.html -->   insert another file (rendered with the same data)
  <!-- @each item in projects -->  ...  <!-- @end -->   repeat for every array element
                                   (inside the loop, {{ loop.index }} is 0, 1, 2… and {{ loop.count }} the list length)
  <!-- @if item.href --> ... <!-- @else --> ... <!-- @end -->   conditional block

Unknown variables and missing includes throw, so typos fail the build
instead of silently publishing an empty value.
*/

import fs from "node:fs";
import path from "node:path";

const TOKEN = /<!--\s*@(include|each|if|else|end)\b\s*(.*?)\s*-->|\{\{\s*([\w.]+)\s*\}\}/g;

export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function lookup(scope, expression, file) {
    let value = scope;
    for (const key of expression.split(".")) {
        if (value === null || typeof value !== "object" || !(key in value)) {
            throw new Error(`${file}: unknown value "${expression}"`);
        }
        value = value[key];
    }
    return value;
}

/** Parses template source into a tree of text, value, include, each and if nodes. */
function parse(source, file) {
    const root = { children: [] };
    const stack = [root];
    let last = 0;
    const current = () => stack.at(-1);
    const push = (node) => (current().inElse ? current().otherwise : current().children).push(node);

    for (const match of source.matchAll(TOKEN)) {
        push({ type: "text", text: source.slice(last, match.index) });
        last = match.index + match[0].length;
        const [, directive, args, expression] = match;

        if (expression) {
            push({ type: "value", expression });
        } else if (directive === "include") {
            push({ type: "include", target: args });
        } else if (directive === "each") {
            const each = args.match(/^(\w+)\s+in\s+([\w.]+)$/);
            if (!each) throw new Error(`${file}: expected "@each item in list", got "@each ${args}"`);
            const node = { type: "each", name: each[1], expression: each[2], children: [] };
            push(node);
            stack.push(node);
        } else if (directive === "if") {
            const node = { type: "if", expression: args, children: [], otherwise: [] };
            push(node);
            stack.push(node);
        } else if (directive === "else") {
            if (current().type !== "if" || current().inElse) throw new Error(`${file}: @else without @if`);
            current().inElse = true;
        } else if (directive === "end") {
            if (stack.length === 1) throw new Error(`${file}: @end without @each or @if`);
            stack.pop();
        }
    }
    if (stack.length > 1) throw new Error(`${file}: missing @end for @${current().type}`);
    push({ type: "text", text: source.slice(last) });
    return root.children;
}

function renderNodes(nodes, scope, context) {
    let output = "";
    for (const node of nodes) {
        if (node.type === "text") {
            output += node.text;
        } else if (node.type === "value") {
            output += escapeHtml(lookup(scope, node.expression, context.file));
        } else if (node.type === "include") {
            output += renderFile(node.target, scope, context);
        } else if (node.type === "each") {
            const items = lookup(scope, node.expression, context.file);
            if (!Array.isArray(items)) throw new Error(`${context.file}: "${node.expression}" is not a list`);
            items.forEach((item, index) => {
                output += renderNodes(node.children, { ...scope, [node.name]: item, loop: { index, count: items.length } }, context);
            });
        } else if (node.type === "if") {
            // Optional fields: a missing key counts as false rather than an error.
            let value;
            try { value = lookup(scope, node.expression, context.file); } catch { value = undefined; }
            const truthy = Array.isArray(value) ? value.length > 0 : Boolean(value);
            output += renderNodes(truthy ? node.children : node.otherwise, scope, context);
        }
    }
    return output;
}

/** Renders a template string. `file` is only used in error messages. */
export function render(source, data, { root = process.cwd(), file = "<template>", including = [] } = {}) {
    return renderNodes(parse(source, file), data, { root, file, including });
}

/** Renders a template file; include paths are relative to `root`. */
export function renderFile(target, data, { root = process.cwd(), including = [] } = {}) {
    const file = path.join(root, target);
    if (including.includes(file)) throw new Error(`Include cycle: ${[...including, file].join(" -> ")}`);
    if (!fs.existsSync(file)) throw new Error(`${including.at(-1) ?? "template"}: include not found "${target}"`);
    return render(fs.readFileSync(file, "utf8"), data, { root, file: target, including: [...including, file] });
}
