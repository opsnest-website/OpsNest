# opsnest
OpsNest is my long-term initiative to build a comprehensive ecosystem of automation scripts, DevOps utilities, technical documentation, templates, and developer tools. Some projects are production-ready, others are experimental, and many are still being built. Every release is documented, open, and focused on solving real operational problems.

## Website structure

The landing page is assembled from small files by a dependency-free build script (Node.js 20+, no `npm install` needed).

```text
index.html            Page layout: <head> plus one @include per section, in page order
components/           One HTML partial per section (header, hero, about, projects, roadmap, …)
  partials/           Repeated pieces: project card, update card, nav link
data/                 Content lists rendered into the partials
  site.json           Name, title, description, copyright, social links
  navigation.json     Header and footer links
  projects.json       Featured projects        blog-topics.json  Blog topic cards
  roadmap.json        Roadmap milestones       updates.json      Latest updates
  technologies.json   Technology stack         faq.json          FAQ entries
  orbit.json          Rotating circle in the Community section: core areas (inner ring) and technologies (outer ring)
css/style.css         Imports every stylesheet in cascade order (bundled into one file by the build)
css/<section>.css     Styles for one section, including its responsive rules
js/app.js             Page script
assets/               Images; the logo files are generated, see below
brand/                Logo source artwork and the light/dark logo kit (not published)
scripts/              build.mjs (build), dev.mjs (preview server), template.mjs (+ tests), make_logos.py
```

### Common edits

- **Add a project, roadmap milestone, update, FAQ or technology:** add an entry to the matching file in `data/`. No HTML changes needed.
- **Change a section's markup:** edit its file in `components/`. Styles for that section are in the `css/` file with the same name.
- **Add a section:** create `components/<name>.html` (and `css/<name>.css` if needed), then add `<!-- @include components/<name>.html -->` to `index.html` and `@import url("<name>.css");` to `css/style.css`.

Template syntax (see `scripts/template.mjs`): `{{ site.name }}` inserts an escaped value, `<!-- @each item in projects --> … <!-- @end -->` repeats a block (with `{{ loop.index }}` and `{{ loop.count }}` available inside), `<!-- @if item.href --> … <!-- @else --> … <!-- @end -->` is a conditional, and `<!-- @include path -->` inserts a partial. Unknown values and missing files fail the build.

### Commands

```bash
npm run dev     # build, serve http://localhost:8080 and rebuild on every change
npm run build   # write the publishable site to dist/
npm test        # template engine and theme tests
npm run logos   # regenerate the logo images (needs Python 3 + Pillow: pip install pillow)
```

### Light and dark theme

The site follows the visitor's system setting by default. The switch in the header (System / Light / Dark) overrides it, and the choice is saved in the browser (`localStorage` key `opsnest-theme`).

- **Colours** are CSS variables in `css/variables.css`: dark values on `:root`, light values in two identical blocks below it. `npm test` fails if those two blocks drift apart. Use a variable (`var(--text)`, `var(--surface)`, …) rather than a fixed colour in section styles, or the section will not adapt.
- **Theme-specific images** use `<picture>` with a light `<source data-theme-source="light">` (see `components/hero.html`); `js/app.js` points that source at the visitor's choice.
- **No flash on load:** a small script in the `<head>` of `index.html` applies the saved choice before the page paints. The theme logic lives in `js/app.js`.

### Analytics

Visitor stats are cookie-free, so the site needs no cookie consent prompt. To turn them on, sign up with one provider and fill in its value under `analytics` in `data/site.json` (leave the others empty):

| Provider | Value | Cost |
|---|---|---|
| [GoatCounter](https://www.goatcounter.com) | your site code, e.g. `opsnest` for opsnest.goatcounter.com | free for non-commercial use, open source |
| [Plausible](https://plausible.io) | the domain, `opsnest.in` | paid |
| [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) | the site token from the dashboard | free, needs a Cloudflare account |

The script tags live in `components/partials/analytics.html`. If you add anything that does set cookies or track visitors across sites (Google Analytics, ads, embedded videos), it will need a consent prompt first.

### Logo

`brand/logo-master.png` is the source artwork, drawn for a light background. `npm run logos` generates every logo the site uses into `assets/`: a dark-background version for the hero (`logo-dark-bg.webp`) and for the header and footer (`mark-dark-bg.png`, symbol only), the matching light-background versions (`logo-light-bg.webp`, `mark-light-bg.png`) for light mode, plus `favicon.png`, `apple-touch-icon.png` and the link preview `og-image.png` in the original colours on white. After replacing the master, run it and commit the regenerated files; the build itself does not need Python.

For use outside the site (README, GitHub, slides), the same command writes a logo kit into `brand/`, as transparent PNGs:

| | Light background | Dark background |
|---|---|---|
| Full logo | `brand/logo-light-bg.png` | `brand/logo-dark-bg.png` |
| Symbol only (512px) | `brand/mark-light-bg.png` | `brand/mark-dark-bg.png` |

`index.html` is a template, so open the site through `npm run dev` rather than directly from disk. Only the files listed in `STATIC_FILES` in `scripts/build.mjs` (plus the rendered page and bundled CSS) are published.
