# Integrating OpsNest Markbase as a separate repository

Markbase is maintained independently in:
`https://github.com/opsnest-website/opsnest-markbase.git`

OpsNest includes it as a Git submodule at `modules/markbase`. GitHub Pages builds the React/Vite project and publishes it under `/learn/`.

## Add the submodule (run in your real OpsNest Git clone)

If this repository does not yet have the submodule:

```bash
git submodule add https://github.com/opsnest-website/opsnest-markbase.git modules/markbase
git add .gitmodules modules/markbase
git commit -m "Add Markbase learning module"
git push
```

If you already added it, don't run `git submodule add` again. Instead confirm `.gitmodules` has:

```ini
[submodule "modules/markbase"]
    path = modules/markbase
    url = https://github.com/opsnest-website/opsnest-markbase.git
```

## Clone or update with the module

```bash
git clone --recurse-submodules <OPSNEST_REPOSITORY_URL>
# for an existing clone:
git submodule update --init --recursive
# pull latest Markbase commit recorded by OpsNest:
git submodule update --remote modules/markbase
```

A submodule pins a specific Markbase commit in OpsNest. Updating Markbase's own repository does not automatically update the pinned commit in OpsNest; run the update command, review, commit and push the new gitlink.

Dependabot (`.github/dependabot.yml`) checks both modules daily and opens a PR that bumps the pinned commit when a module's `main` has moved. Merging that PR is what publishes Markbase or Blog changes to the live site. Each module repository runs its own CI (`.github/workflows/ci.yml`) on every PR, so a commit is already type-checked and built before OpsNest pins it.

## Deployment behavior

The `deploy-pages.yml` workflow:
1. Checks out OpsNest and its submodules at exactly the pinned commits (it does not pull the latest module `main`).
2. Runs `npm ci`, `npm run check` and `npm run build` in `modules/markbase`.
3. Publishes Markbase's generated `dist/` into the website output at `dist/learn/`.
4. Deploys the OpsNest site and Markbase together to GitHub Pages.

The Markbase Vite config should use a relative base (`base: "./"`) so assets work when hosted below `/learn/`. Do not commit generated `dist/` files to either repository.

The top-level navigation link points to `learn/`, so visitors can open Markbase from OpsNest.

## Important

- The submodule URL must be accessible to GitHub Actions. A public repository works with the default checkout token; a private submodule needs a separate credential/token and a secure workflow configuration.
- The workflow assumes `modules/markbase/package-lock.json` is committed. Generate it by running `npm install` once in the Markbase repository, then commit the lockfile.
- The ZIP of this integration guide is not itself a Git repository and cannot preserve Git submodule metadata. Apply the changes in your actual OpsNest clone using the commands above.
