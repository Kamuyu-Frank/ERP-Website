# SnapERP Website

Animated ERP sales website demonstrating purchasing, receiving, processing, inventory, invoicing, payment, delivery and accounting. Includes the supplied animated logo, an interactive SVG factory journey, responsive layouts and a demo-request form.

## Project structure

- `app/`: React 19 and TanStack Start application, build configuration and vendored workspace packages.
- `app/public/assets/`: logo, illustrations, icons and favicon assets.
- `app/src/routes/index.tsx`: main sales page.
- `app/src/components/`: UI and animation components.
- `app/src/snaperp.css`: website styling.
- `app/src/lib/api/demo.functions.ts`: validated demo-request handler.
- `app/migrations/`: Cloudflare D1 database migrations.
- `refs/`: design reference assets.

## Build

Use Node.js 22 or newer and Bun. Run commands from `app/`:

```sh
cd app
bun install --frozen-lockfile
bun run typecheck
bun run build
```

The application emits `dist/client` static assets and a server-side Worker bundle. Keep the vendored `app/packages/` workspace dependencies: they are part of the imported build.

## Hosting and database

This is a server-rendered Cloudflare Worker application, not a static GitHub Pages site. Adding the code to GitHub does not change access to the existing Higgsfield deployment or automatically publish a new website.

The included `app/wrangler.jsonc` is the original development/build configuration. Higgsfield normally generates its production configuration. For independent Cloudflare deployment, configure your own Worker name, D1 database binding named `DB`, database ID and migrations directory; verify the built Worker entry and the `dist/client` asset directory. Use `wrangler dev` to preview the configured Worker and apply the SQL migrations before using the demo form. Configure any deployment credentials through your hosting provider or GitHub secrets, never in source files.

The demo form stores requests in D1. This export contains the database schema, not live customer submissions. It does not include email forwarding.

## Integrations and content

M-Pesa, KRA eTIMS, manufacturing and delivery scenes illustrate the proposed business workflow. This marketing site does not perform real payments, tax submissions or ERP transactions. The ERP login link points to the separately hosted ERP.

Before launching under a new domain, update the canonical URL and Open Graph URL in `app/src/routes/__root.tsx`, review `app/src/app-meta.json`, and decide whether to remove the existing `noindex, nofollow` setting. Some generated launch images are referenced using external asset URLs.

## Import

Source exported from the existing SnapERP Higgsfield website. The original application files and assets are preserved. The existing Higgsfield site remains separate from this GitHub repository.

## Push this ZIP locally

The GitHub repository already contains the setup README. Preserve that initial commit by cloning it first, then copying the extracted project files into the clone (including dotfiles). Do not copy any `.git` directory.

```sh
git clone git@github.com:bkyalo/ERP-Website.git
# Copy the extracted ZIP contents into ERP-Website.
cd ERP-Website
git add .
git commit -m "Import complete SnapERP website"
git push origin main
```

The ZIP includes source and resource files. Install Node/Bun dependencies using the lockfile; generated `node_modules` and build output are intentionally excluded.


## Portable ZIP resources

This ZIP includes local launch images (`app/public/assets/launch-og.png`, `launch-cover.png`) and downloaded web fonts. The main site font import uses `/assets/fonts/fonts.css`, so the page does not need Google Fonts at runtime. Launch metadata retains the original asset URLs; update them for your new hosting domain or use the bundled image copies. Dependencies are installed with Bun from the included lockfile.

## GitHub Actions on main

`.github/workflows/ci.yml` runs on pushes to `main`, pull requests targeting
`main`, and manual dispatch. It uses GitHub-hosted Ubuntu runners, Node 22 and
Bun 1.4.2 with the committed lockfile. The pipeline runs lint, all tests, the UI
contract, TypeScript checks and the production build. It also checks that the
Worker, journey assets and local Quicksand font exist and that generated routes
match the committed route tree.

Successful runs publish `snaperp-build-<commit SHA>` as a seven-day build artifact
containing the Worker, static assets, migrations and application manifest. The
production bundle does not enable the development design inspector. Actions are
pinned to commit SHAs and the workflow has read-only repository permissions.

**Hosting deployment is not enabled yet.** Choose the deployment destination
before adding a publish job. The current `wrangler.jsonc` contains development
placeholders and must not be used to deploy to production. Independent Cloudflare
hosting needs an account, a Worker target, a D1 database and a deployment token
stored as a GitHub secret; Higgsfield hosting needs its supported deployment path.
CI and artifact creation require no hosting credentials.
