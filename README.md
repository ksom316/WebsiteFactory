# Website Factory

A private, single-operator workspace for building client websites from reusable templates.

## Architecture

- **Frontend**: React 19 + React Router 7, built with Vite and Tailwind CSS v4. The dashboard
  shell itself is unchanged from Phase 1 apart from the auth gate (`src/auth/`) and a
  `LoginPage`. Phase 3 added `src/templates/corporate/` — see
  [Corporate website template family](#corporate-website-template-family) — which renders
  independent client websites and deliberately does not share styling with the dashboard.
- **API**: plain Node `http` handlers under `api/**/*.ts` — each file's default export is a
  `(req, res) => void | Promise<void>` function. There is no separate server process:
  - **In production**, Vercel deploys each file as its own serverless function automatically.
  - **Locally**, `vite/apiDevPlugin.ts` mounts the same files as Vite dev-server middleware, so
    `npm run dev` is the only command you need — no `vercel dev`, no second process.
  - 10 functions exist (`health`, `auth/login`, `auth/session`, `auth/logout`,
    `projects` (list + create), `projects/detail` (read + edit + archive/restore),
    `projects/config` (read/save/restore a configuration version), `projects/export`
    (download a standalone website ZIP — see Phase 6), `projects/deploy` (start a Vercel
    deployment + check status/history — see Phase 7, below), `templates`) — comfortably
    under Vercel Hobby's limits. New routes were added as more methods on existing-shaped
    files, or one clearly-justified new file per genuinely new capability, rather than a
    new file per UI action, to keep that count low.
  - There are no Vercel `[param].ts` dynamic route files — resource ids are passed as query
    strings instead (e.g. `/api/projects/detail?id=<uuid>`), because the dev plugin mounts
    handlers by exact file path. See `vite/apiDevPlugin.ts`'s header comment.
- **Database**: Neon Postgres via `@neondatabase/serverless`'s HTTP driver (`neon()`
  tagged-template queries in `api/_lib/db/`). Each query is a stateless HTTPS request — there is
  no connection pool to manage or leak across invocations.
- **Migrations**: plain, idempotent `.sql` files in `migrations/`, applied by
  `scripts/migrate.ts` (uses `pg`, a plain driver — no ORM) tracked in a `schema_migrations`
  table. Migrations are never run automatically on a request; you run them deliberately.
- **Auth**: a single administrator account defined entirely by environment variables (no
  accounts table, no sign-up flow). Sessions are signed JWTs (`jose`, HS256) in an
  `HttpOnly`/`SameSite=Lax` cookie (`Secure` in production). Passwords are never stored in
  plaintext — only a `scrypt` hash. See [Security limitations](#security-limitations--production-setup)
  below.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values — see below
npm run db:migrate           # creates tables (requires a Neon database)
npm run dev
```

The app runs at the URL Vite prints (typically http://localhost:5173). The API lives under
`/api/*` on the same origin — no separate port or proxy.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Needed locally | Needed in Vercel | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | yes | Neon **pooled** connection string. |
| `MIGRATIONS_DATABASE_URL` | optional | optional | Neon **direct/unpooled** string for `db:migrate`. Falls back to `DATABASE_URL`. |
| `ADMIN_USERNAME` | yes | yes | The only account. Not secret, but keep it out of git anyway (it lives in `.env.local`, which is ignored). |
| `ADMIN_PASSWORD_HASH` | yes | yes | Output of `npm run db:hash-password -- "<password>"`. Never put a plaintext password in any env var. |
| `SESSION_SECRET` | yes | yes | ≥32 random characters. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `VERCEL_TOKEN` | optional | optional | Enables the **Deploy to Vercel** feature (Phase 7, below). Without it, that section of the project page shows a "not configured" state and everything else works exactly as before. |
| `VERCEL_TEAM_ID` | optional | optional | Only needed if `VERCEL_TOKEN` belongs to a Vercel Team rather than a personal account. |

`.env.local` (and any `.env*` file except `.env.example`) is covered by `.gitignore` — never
commit real values.

### Creating a Neon project and getting a pooled connection string

1. Create a free account at Neon and create a new project (a new project is a separate,
   isolated Postgres instance — don't reuse another project's database for this app).
2. In the Neon console, open the project's **Connect** panel.
3. Copy the connection string labeled **pooled connection** (it points at a `-pooler` host) into
   `DATABASE_URL`. Optionally also copy the **direct connection** string into
   `MIGRATIONS_DATABASE_URL` — Neon recommends running DDL (migrations) against the direct
   endpoint rather than through the pooler.
4. Run `npm run db:migrate`. It is idempotent: rerunning it is always safe, and it only applies
   files in `migrations/` that haven't been applied yet (tracked in `schema_migrations`). As of
   Phase 7 there are two files — `0001_init.sql` and `0002_deployments.sql` — both applied by
   this one command. **This command was not run against the real database as part of this
   phase's implementation** — run it yourself before using the deployment feature; see Phase 7
   below.

### Generating the admin credential and session secret

```bash
npm run db:hash-password -- "choose-a-strong-password"
# copy the printed "scrypt:..." line into ADMIN_PASSWORD_HASH

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# copy the output into SESSION_SECRET
```

### Creating a Vercel token for deployment integration (optional)

1. Sign in at vercel.com and open **Account Settings → Tokens** (or, for a team, that
   team's **Settings → Tokens** so the token is scoped to the team).
2. Create a token with the shortest expiry that's practical for you, scoped to the
   specific team this app should deploy into if you have more than one.
3. Put it in `VERCEL_TOKEN` in `.env.local`. If it's a team token, also set
   `VERCEL_TEAM_ID` to that team's ID (Team Settings page — the ID, not the display
   name or slug).
4. Restart `npm run dev` so the new environment variable is picked up (see
   [Local setup](#local-setup) — env vars are only read at server start).

Without this, every other feature of the app works unchanged; the project page's
deployment section just shows a "not configured" explanation instead of deploy buttons.

### Running and testing locally

```bash
npm run dev         # app + API, http://localhost:5173
npm run typecheck
npm run lint
npm run test         # unit tests — no live database or real credentials needed
npm run build
```

The ordinary test suite never talks to a real Neon database or uses real credentials; database
and auth dependencies are mocked at the module boundary (see `api/**/*.test.ts`).

### Configuring Vercel (when you're ready to deploy — not done in this phase)

Set the same variables (`DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`,
`SESSION_SECRET`, optionally `MIGRATIONS_DATABASE_URL`) in the Vercel project's Environment
Variables settings. Vercel auto-detects the Vite framework and the `api/` directory — no
`vercel.json` is required for this phase. Run `npm run db:migrate` against the production
database from your own machine (or CI) before relying on the deployed app; migrations do not run
automatically on request.

## Security limitations & production setup requirements

- **Login rate limiting is per-instance, not global.** `api/_lib/rateLimit.ts` uses an in-memory
  counter. Serverless functions can run as several concurrent instances and are recycled on cold
  start, so this throttles repeated attempts hitting the same warm instance but is **not** a
  reliable global rate limit in production. A robust limit needs a shared store (e.g. Vercel KV
  or Upstash Redis), which is intentionally not added here to avoid an unnecessary paid
  dependency for a single-owner internal tool.
- **Sessions are stateless JWTs, not revocable server-side.** Logout clears the browser's cookie,
  but a copied token remains valid until it expires (7 days) — there is no server-side session
  store to invalidate it early. If that token is well-attended for your threat model
  (credentials leak, no persistent XSS, HTTPS-only), this is an acceptable trade-off for a
  single-admin internal tool; if not, logout invalidation would need a server-side revocation
  list.
- **CSRF protection covers state-changing requests, not login itself.** Login is deliberately
  exempt from the double-submit CSRF check: a login-CSRF attack would only log the victim's
  browser into the attacker's own (single) account, which carries no meaningful risk here.
  Logout and all future mutating endpoints go through `withAuth`, which does enforce it.
- **Missing configuration fails safely, not silently.** If `SESSION_SECRET`, `ADMIN_USERNAME`,
  `ADMIN_PASSWORD_HASH`, or `DATABASE_URL` are unset, the affected endpoint returns a generic
  `503`/`500` and logs the real cause server-side — it never falls back to an insecure default or
  leaks the missing variable's value to the browser.
- **`Secure` cookies are only enforced when `VERCEL_ENV`/`NODE_ENV` is `production`.** Local HTTP
  development would otherwise never set a cookie in some browsers.

## Template families

Website Factory supports more than one **template family** — a fundamentally different
configuration schema and renderer (corporate vs. restaurant vs. real estate vs. portfolio vs.
catalog vs. e-commerce). This is distinct from a **variant**, which is a different visual treatment *within* a family that shares the same
schema (corporate's Premium/Neutral). Adding a new family does not duplicate the application —
it adds one new `src/templates/<family>/` module plus a handful of small, explicit `switch`
cases in a few integration points; it never requires a generic plugin/registration framework.

**Where the model lives:**

- `src/templates/<family>/schema.ts` — each family's own Zod schema, with a self-describing
  `family: z.literal('<family>').default('<family>')` field. The default is what makes this
  additive rather than a reinterpretation: a config saved before this field existed has no
  `family` key at all, and parses exactly as it always did (as corporate) — no existing
  project's saved design is ever silently reassigned.
- `src/templates/parseConfig.ts` — the one server-safe module that knows every family exists.
  `resolveFamily(input)` peeks a raw config's `family` tag; `parseTemplateConfig(input)`
  dispatches to the matching family's own parser; `getTemplateLabel(config)` and the
  `TEMPLATE_FAMILIES` list back the UI. This file has no React/JSX in it on purpose, so API
  handlers and db query modules (plain Node/Vercel serverless code) can import it without
  pulling a component tree into their bundle.
  - **Two distinct "unknown" cases, handled differently (added in Phase 9.2):** a config with
    **no `family` key at all** defaults to `corporate` — this is the backward-compatible case
    for every config saved before this field existed, and must keep parsing exactly as it
    always did. A config with a `family` key set to **something other than a known id**
    instead throws `UnknownTemplateFamilyError` rather than also defaulting to corporate —
    silently rendering genuinely mismatched/corrupted data as if it were corporate would be
    worse than failing. Every call site that reaches this through an API route is already
    wrapped in a try/catch that reports a generic 500 (see `api/_lib/errors.ts#handleApiError`),
    so this fails the one request safely instead of crashing the process or mis-rendering data.
- `src/templates/registry.tsx` — the one frontend-only module that knows every family exists for
  *rendering*: the `AnyTemplate` dispatcher component renders whichever family's template a
  config's `family` tag identifies. Kept as a separate file from parseConfig.ts purely so
  react-refresh's "a file that exports a component must export only components" rule is happy.
- `projects.template_id` (an existing column, see `migrations/0001_init.sql`) is reused as the
  **family** id at the project level (`'corporate'`, `'restaurant'`, `'real-estate'`,
  `'portfolio'`, `'catalog'`, or `'ecommerce'`) — no new column was needed. Each id must exist
  as a row in `templates` to satisfy that foreign key, which is why adding a family needs one
  small forward-only migration (see `migrations/0003_restaurant_template.sql`,
  `migrations/0004_real_estate_template.sql`, `migrations/0005_portfolio_template.sql`,
  `migrations/0006_catalog_template.sql`, and `migrations/0007_ecommerce_template.sql`) that
  only inserts that row. Project creation builds the `templates` row id and the config's own
  `family` tag from the **same** switch (see `api/projects/index.ts#buildStartingConfig`), which
  is what keeps the two from ever disagreeing at creation time.

**Adding a seventh family** means, in full:

1. Write `src/templates/<family>/schema.ts` (with the `family` literal default),
   `registry.ts` (just a `<FAMILY>_TEMPLATE_ID` constant), a renderer + `sections/*.tsx`, its own
   `components/{SafeLink,SafeImage,links.ts}` (duplicated, not shared — see below), a
   `tokens.css`, and `sample-data/`.
2. Add one case each to `parseConfig.ts`'s `TEMPLATE_FAMILY_IDS`/`TEMPLATE_FAMILIES`/
   `parseTemplateConfig`/`resolveFamily`/`getTemplateLabel` and to `registry.tsx`'s `AnyTemplate`.
3. Add a new forward-only migration that inserts that family's `templates` row (see the pattern
   in `migrations/0007_ecommerce_template.sql`) — write and test it, but don't apply it until
   the team is ready and a database is reachable (see that file's own header comment on how to
   apply it manually).
4. Add one case each to `scripts/buildExportManifest.ts`'s `FAMILIES` list and to
   `api/_lib/export/buildSiteFiles.ts`/`generateFiles.ts`'s family switches, so the family's own
   files ship correctly in exported ZIPs/deployments.
5. Add a family option to `CreateProjectPage.tsx`, `api/_lib/projectValidation.ts`'s
   `PROJECT_FAMILIES`, and `api/projects/index.ts#buildStartingConfig`; and either reuse the
   shared `ConfigForm` pattern or (if the family's fields don't map onto an existing editor, as
   with restaurant, real estate, portfolio, catalog, and e-commerce) build a small
   family-specific editor like `RestaurantConfigForm.tsx`/`RealEstateConfigForm.tsx`/
   `PortfolioConfigForm.tsx`/`CatalogConfigForm.tsx`/`EcommerceConfigForm.tsx`.

**Why each family duplicates `SafeLink`/`SafeImage`/`links.ts` instead of sharing one copy:**
these are small (a few lines each), and a shared module would mean every family statically
depends on one file that isn't "owned" by any of them — any future tweak to one family's link
safety rules would risk touching another family's rendering. Duplicating them keeps each family
genuinely self-contained (see each family's own "Standalone rendering boundary" section below),
at the cost of a few lines of repeated, simple code.

## Corporate website template family

`src/templates/corporate/` holds the reusable corporate website template and its two design
variants. It is a self-contained module — see [Standalone rendering boundary](#standalone-rendering-boundary)
below — and is entirely separate from the factory dashboard's own styling and theme system.

- **Premium Agency / Technology** (`variant: 'premium'`) — editorial and confident, for
  technology firms, studios, and consultancies. Deep marine-navy palette, a serif display face
  (`Fraunces`) paired with a grotesk body face (`Archivo`), an asymmetric editorial grid, and a
  services list presented as a spec sheet rather than icon cards.
- **Neutral Business** (`variant: 'neutral'`) — clean and approachable, a versatile foundation
  for most small and medium-sized businesses. Warm putty palette, a single humanist sans
  (`Figtree`), a centered layout, and flat color panels instead of card-and-shadow treatments.

Both variants render through the exact same `CorporateConfig` shape and the same shared,
accessible building blocks (`src/templates/corporate/components/{SafeLink,SafeImage}.tsx`) — a
variant is purely a different arrangement of the same data, which the showcase proves by letting
you render either sample profile through either variant.

### Configuration schema and defaulting behavior

`src/templates/corporate/schema.ts` defines a Zod schema (`corporateConfigSchema`) covering
business identity, logo, brand colors, contact details and hours, nav links, hero content, about
content, services, trust indicators, testimonials, portfolio highlights, a contact CTA, footer
details, per-section visibility flags, and SEO metadata. This is the exact shape meant to be
stored in `project_config_versions.config` (JSONB) once project editing exists.

`parseCorporateConfig(input)` never throws:

- Every field is optional or has a `.default(...)`, so `parseCorporateConfig({})` returns a
  fully-formed config — no business has to populate every field.
- Risky leaf values (hex colors, image/CTA URLs, nav/footer links) use `.catch(...)`: an invalid
  one is replaced by a safe default (or `'#'` for an unsafe link) instead of failing the whole
  config.
- A config saved by an older schema version that's missing fields added later still parses
  cleanly — the new fields just take their defaults. This is what keeps saved projects
  forward-compatible as the schema grows.
- Links are allow-listed to internal anchors/paths, `mailto:`, `tel:`, and `https://` — anything
  else (`javascript:`, bare `http://`, `data:`, …) is rejected. All business text is rendered
  through normal React text nodes, never `dangerouslySetInnerHTML`, so stored content can never
  become markup or script.

### Accessing the authenticated showcase

Sign in, then open **Templates** in the sidebar (`/templates`). Pick a design variant and a
sample business profile independently — the preview (`/templates/preview`, an iframe so the
client site's styles can never bleed into the dashboard's) re-renders with that combination. A
desktop/mobile toggle resizes the iframe to check responsiveness. Nothing here is saved; it's a
development aid, not the project editor that a later phase will build.

### Adding another template variant safely

1. Add the variant's id to the `variant` enum in `schema.ts` and to `CORPORATE_VARIANTS` in
   `registry.ts` — no database migration is needed; the variant lives entirely in config.
2. Create `src/templates/corporate/variants/<id>/` with its own `tokens.css` (scoped under a
   `.wf-corporate--<id>` class, independent of both the factory's `--color-*` tokens and
   `[data-theme]`) and a `Site.tsx` that assembles that variant's own `sections/*.tsx`.
3. Add the new variant to the `switch` in `CorporateTemplate.tsx`.
4. Reuse `components/SafeLink.tsx` and `components/SafeImage.tsx` for any link or image so the
   same safety guarantees apply automatically.
5. Add a sample profile under `sample-data/` if you want it in the showcase's profile picker.

### Standalone rendering boundary

Nothing under `src/templates/corporate/` imports from `api/`, `src/auth/`, or any other
Neon/session-aware module — every component takes its data entirely through the typed `config`
prop. `CorporateTemplate` is the single entry point: given a `CorporateConfig`, it renders a
complete page with no network calls, no auth check, and no factory chrome. `TemplatePreviewPage`
(`src/pages/TemplatePreviewPage.tsx`) demonstrates this directly — it's the bare render path with
zero dashboard UI around it. A future static/ZIP export (a later phase) only needs to serialize a
project's `config` and run it through this same component; the factory-only showcase and
authentication code stay entirely outside that boundary.

### Known limitations

- The showcase embeds the preview in an `<iframe>` rather than inline, which is what keeps the two
  design systems from ever touching each other's CSS — but it also means the preview is a true
  page navigation (its own `index.html`), not a live hot-reloading view of in-progress edits.
- No images are fetched by the app itself; `imageUrl` fields are optional `https://` URLs a
  project's config may supply later. If one 404s, `SafeImage` swaps to a CSS placeholder — the
  layout never breaks — but this phase ships no bundled images, only CSS-drawn placeholders.
- No live browser/visual QA tool was available in this environment; verification here relied on
  jsdom-rendered component tests plus manual inspection of the compiled CSS. Open `/templates` in
  an actual browser (light and dark factory theme, and at a narrow viewport) before treating the
  visual design as final.

## Restaurant website template family

`src/templates/restaurant/` is the second template family (see [Template families](#template-families)
above), added in Phase 9.1. It is a single design — a warm editorial food-and-hospitality
aesthetic (serif display face `Cormorant Garamond`, humanist sans body `Jost`, a terracotta +
deep olive palette on a warm ivory ground) distinct from both corporate variants — rather than
multiple variants, since one restaurant has one era-appropriate design register.

### Configuration schema and defaulting behavior

`src/templates/restaurant/schema.ts` defines `restaurantConfigSchema`, mirroring the corporate
schema's never-throws defaulting pattern (every field optional or defaulted, risky leaf values
`.catch(...)` a safe fallback) but with its own restaurant-specific shape: restaurant identity
(name/tagline/description/location), logo, nav, hero, a menu of categories each holding items
(name/description/price), a photo gallery, hours, contact details, an optional external
**reservation link**, optional social links, per-section visibility flags, footer, and SEO.
`parseRestaurantConfig(input)` never throws, exactly like `parseCorporateConfig`.

There is deliberately **no in-app reservation system, online ordering, or payment processing** —
`contact.reservationUrl` is just a validated `https://` URL to an external booking provider
(e.g. OpenTable, Resy, Tock). If it's absent, every reservation call-to-action disappears from
the rendered page instead of linking nowhere.

### Sample profile

`sample-data/gildedFig.ts` is "The Gilded Fig," a fictional Mediterranean bistro — its contact
details, address, and phone number are all invented for this sample and are not a real person
or business. Its images reference a placeholder host (`https://images.example.com/...`) rather
than real assets: this factory does not host or proxy images itself, so a real restaurant
project must supply its own publicly-accessible `https://` image URLs. Until then, those URLs
simply fail to load and `SafeImage`'s fallback (initials on a soft gradient) renders instead —
the layout never breaks.

### Interaction behavior

- The mobile nav is a controlled open/closed `<button>` toggle (not corporate's `<details>`
  pattern) with `aria-expanded`, closing automatically when a nav link inside it is clicked.
- `tel:`/`mailto:` links are built from `contact.phone`/`contact.email` using the same
  allow-listed `href` validator as corporate's; an absent phone/email simply omits that line
  rather than rendering a broken link.
- Menu, gallery, and hours sections render nothing at all when they have no content (not an
  empty heading/shell), and are independently hidden by their own `sections.<name>` flag even
  when content is present — matching corporate's `sections` convention exactly.

### Standalone rendering boundary

Nothing under `src/templates/restaurant/` imports from `api/`, `src/auth/`, or any other
Neon/session-aware module, and it does not import anything from `src/templates/corporate/`
either — the two families are siblings, not a shared base one depends on. `RestaurantTemplate`
is the single entry point: given a `RestaurantConfig`, it renders a complete page with no
network calls, no auth check, and no factory chrome.

### Editing in the factory

`src/pages/project-detail/RestaurantConfigForm.tsx` is a clean, family-specific editor (several
focused section components under `restaurant-sections/`) rather than a generalization of the
corporate `ConfigForm.tsx` — restaurant's fields (menu categories/items, hours, gallery,
reservation link) don't map onto corporate's sections, and the brief this family was built
under explicitly preferred a second small, concrete editor over a generic form-generation
framework. `ProjectDetailPage.tsx` picks which editor to render based on the draft config's
`family` tag; the corporate editor is otherwise untouched.

### Known limitations

- No runtime icon library is used in the restaurant nav (plain inline SVGs instead) — the
  exported standalone site's `package.json` only ships `react`/`react-dom`/`zod` as runtime
  dependencies (see [Standalone website export](#standalone-website-export-zip) below), and
  adding a new icon package there would mean every restaurant export needs a matching
  `package.json`/manifest change to still build independently.
- Like corporate, no live browser/visual QA tool was available in this environment;
  verification relied on jsdom-rendered component tests (including a mobile-nav open/close
  interaction test) plus three independent `npm install && npm run build` runs of exported
  sample sites (Fathom, Willow Creek Dental, and the restaurant sample) in isolated temp
  directories outside this repository. Open `/templates` in an actual browser (light/dark
  factory theme, desktop and a narrow viewport) before treating the visual design as final.

## Real-estate website template family

`src/templates/real-estate/` is the third template family (see [Template families](#template-families)
above), added in Phase 9.2. Like restaurant, it is a single design — a restrained, premium
architectural register (serif display face `Libre Baskerville`, clean grotesk body face `Inter`,
a charcoal-on-warm-stone palette with a muted brass accent) distinct from both other families.

### Configuration schema and defaulting behavior

`src/templates/real-estate/schema.ts` defines `realEstateConfigSchema`, mirroring the other two
families' never-throws defaulting pattern, with its own shape: agency identity (name, tagline,
description, logo), hero, a list of property **listings** (title, price, location, property
type, transaction type, bedrooms, bathrooms, area, description, features, images), a team of
**agent profiles** (name, title, photo, email, phone), contact details, an optional external
**enquiry link**, per-section visibility flags, footer, and SEO. `parseRealEstateConfig(input)`
never throws, and additionally fills in a stable, de-duplicated `slug` for every listing (derived
from its title when one isn't supplied) — see "Listing detail links" below for why.

There is deliberately **no property database, search backend, CRM, map integration, payment
processing, or booking backend** — `contact.inquiryUrl` is just a validated `https://` URL to an
external enquiry/CRM form, and every listing is defined entirely by its own config fields.

### Listing detail links and client-side filtering

Each configured property gets a full detail block (gallery, description, bed/bath/area facts,
feature list) rendered unconditionally alongside the listings grid (see
`sections/PropertyDetails.tsx`), anchored by `#listing-<slug>`. A featured-listing card's "View
details" link always points at that same anchor — because the detail section is generated for
every listing, not conditionally, a card link can never point at a detail section that doesn't
exist. There is no separate routed detail page and no router dependency; this keeps the design a
maintainable static site rather than one that needs a backend to resolve a `/listings/:id` route.

The listings grid also has a client-side transaction-type/property-type filter
(`sections/Listings.tsx`) — a plain array filter over the already-configured `listings`, with no
backend search. Filter options are derived from what's actually present in the data, so a
project with only for-sale houses never shows an unusable "For rent" filter that empties the
grid; if a combination of filters matches nothing, a plain message is shown instead of an empty
grid.

### Sample profile

`sample-data/meridianRealty.ts` is "Meridian & Co," a fictional residential/commercial agency —
its agency, agent, and property details are all invented for this sample and are not a real
business, person, or property; no claim about real property availability should be inferred
from it. Like the restaurant sample, its images reference a placeholder host
(`https://images.example.com/...`) rather than real assets — a real project must supply its own
publicly-accessible `https://` image URLs, and until then `SafeImage`'s fallback (initials on a
soft gradient) renders in their place, so the layout never breaks.

### Standalone rendering boundary

Nothing under `src/templates/real-estate/` imports from `api/`, `src/auth/`, or any other
Neon/session-aware module, and it does not import from the corporate or restaurant families
either — all three families are siblings. `RealEstateTemplate` is the single entry point: given
a `RealEstateConfig`, it renders a complete page with no network calls, no auth check, and no
factory chrome.

### Editing in the factory

`src/pages/project-detail/RealEstateConfigForm.tsx` is a clean, family-specific editor (several
focused section components under `real-estate-sections/`), mirroring `RestaurantConfigForm.tsx`'s
approach rather than generalizing the corporate `ConfigForm.tsx` — real-estate's fields (listings
with nested items, agent profiles) don't map onto corporate's sections. `ProjectDetailPage.tsx`
picks which editor to render based on the draft config's `family` tag.

### Known limitations

- No runtime icon library is used in the real-estate nav either, for the same reason as
  restaurant's (see that family's "Known limitations").
- The listing editor's image/feature lists are plain one-URL/one-item-per-line textareas rather
  than a richer repeating-field UI (compare the restaurant menu editor's add/remove/reorder
  controls) — functional, but less polished; a nicer editor could be built later without
  changing the underlying schema.
- Like the other two families, no live browser/visual QA tool was available in this environment;
  verification relied on jsdom-rendered component tests (including mobile-nav open/close and
  client-side listing-filter interaction tests) plus an independent `npm install && npm run
  build` of an exported sample site in an isolated temp directory outside this repository (see
  "Local sample-export workflow" below). Open `/templates` in an actual browser before treating
  the visual design as final.
- Sample images point at a placeholder host, not real assets — **this template is not
  production-ready as shipped**; replace every `imageUrl` with a real, publicly-accessible
  `https://` URL before using it for an actual listing.

### Local sample-export workflow (no database required)

Every check in this section can be run without a reachable database, since it only exercises
pure functions (`buildExportZip`/`buildSiteFiles`) against an in-memory `Project` object and a
family's own sample config — nothing here reads or writes `project_config_versions` or any other
table. This is how the real-estate family (and the existing corporate/restaurant exports) were
re-verified while the live database was unavailable for this phase:

```ts
// scripts/_tmp_generate_exports.ts (not committed — a scratch script, not a project script)
import { writeFileSync } from 'node:fs'
import { buildExportZip } from '../api/_lib/export/buildExportZip'
import { meridianRealtyConfig } from '../src/templates/real-estate/sample-data/meridianRealty'

const project = {
  id: '11111111-1111-4111-8111-111111111111', name: 'Sample', slug: 'meridian-realty',
  businessName: null, templateId: 'real-estate', status: 'draft' as const, vercelProjectId: null,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
}
const { bytes } = buildExportZip({ project, config: meridianRealtyConfig, versionNumber: 1 })
writeFileSync('meridian-realty.zip', bytes)
```

Then, **outside this repository** (a fresh temp directory): extract the ZIP, `npm install`,
`npm run build`, and confirm `dist/` exists with no build errors. This is exactly what was done
for all four sample sites (Fathom, Willow Creek Dental, The Gilded Fig, and Meridian & Co) to
produce the build results reported for this phase.

## Portfolio & personal-brand website template family

`src/templates/portfolio/` is the fourth template family (see [Template families](#template-families)
above), added in Phase 9.3 for developers, designers, photographers, consultants, and other
professionals who need a personal brand or portfolio site. Like restaurant and real estate, it
is a single design — an editorial personal-brand register (serif display face `Spectral`, clean
grotesk body face `Work Sans`, near-black ink on warm paper with a single confident indigo
accent) distinct from the other three families.

### Configuration schema and defaulting behavior

`src/templates/portfolio/schema.ts` defines `portfolioConfigSchema`, mirroring the other three
families' never-throws defaulting pattern, with its own shape: person identity (name, role,
tagline, location, availability, portrait), hero, about (biography + optional image), **selected
work** (a list of projects — title, description, category, image, date, client, role, tools,
optional link), **skills & services** (named skill groups of plain tags, plus optionally-linked
service cards — deliberately no fabricated proficiency percentages or progress bars), an
**experience** timeline (title/organization/period/description entries, equally useful as a
career history or a "how I work" outline), **testimonials**, contact (email, an optional
external booking link, professional/social links), per-section visibility flags, footer, and
SEO. `parsePortfolioConfig(input)` never throws, exactly like the other three families' parsers.

There is deliberately **no contact-form backend, AI writing/content service, or hosted backend
of any kind** — `contact.bookingUrl` is just a validated `https://` URL to an external
scheduling tool (e.g. Calendly), mirroring the restaurant family's `reservationUrl` and the
real-estate family's `inquiryUrl`. Contact itself is `mailto:`/professional links only; there is
no `<form>` that could misleadingly imply a message was submitted to a backend this factory
doesn't run.

### Selected work: category filtering and project links

The work section has a client-side category filter (`sections/Work.tsx`) — a plain array filter
over the already-configured `projects`, with no backend search, mirroring the real-estate
family's listings filter and the restaurant family's absence of one where it isn't needed.
Filter options are derived from what's actually present in the data. A project card only
becomes a link when it has its own validated `href` — a project with no link renders identical
content as a plain, non-interactive `<article>` instead of a link to nowhere, so a card can
never be "clickable but goes nowhere useful." An empty `projects` list renders an intentional,
worded empty state ("Work is on its way…") rather than an empty or missing section.

### Sample profile

`sample-data/lenaAshford.ts` is "Lena Ashford," a fictional product designer — her biography,
client names, and testimonials are all invented for this sample and are not a real person; the
testimonials are explicitly labeled "(illustrative example)" in the sample data so they are
never mistaken for real endorsements. Image URLs point at Unsplash's public photo CDN
(`images.unsplash.com`) rather than an invented domain, since the brief for this phase asked for
credible, generally-stable `https://` sources rather than a placeholder host — **but reachability
of these specific photo URLs was not verified over the network in the environment this sample
was authored in** (no network access was available for that check). Regardless of whether they
load, `SafeImage`'s fallback (initials on a soft gradient) renders in their place, so rendering
never depends on them loading successfully — swap them for real, verified photos before
treating this as a real site.

### Standalone rendering boundary

Nothing under `src/templates/portfolio/` imports from `api/`, `src/auth/`, or any other
Neon/session-aware module, and it does not import from any other family either — all four
families are siblings. `PortfolioTemplate` is the single entry point: given a `PortfolioConfig`,
it renders a complete page with no network calls, no auth check, and no factory chrome.

### Editing in the factory

`src/pages/project-detail/PortfolioConfigForm.tsx` is a clean, family-specific editor (several
focused section components under `portfolio-sections/`), mirroring the restaurant/real-estate
editors' approach rather than generalizing the corporate `ConfigForm.tsx` — portfolio's fields
(project lists, skill groups, an experience timeline) don't map onto corporate's sections.
`ProjectDetailPage.tsx` picks which editor to render based on the draft config's `family` tag.

### Known limitations

- No runtime icon library is used in the portfolio nav either, for the same reason as the
  restaurant and real-estate families' (see their own "Known limitations").
- Sample imagery uses Unsplash URLs whose live reachability was not verified in this
  environment (no network access for that specific check) — treat the sample as illustrative,
  not as proof those exact images will load; replace them with your own verified photos.
- Like the other three families, no live browser/visual QA tool was available in this
  environment; verification relied on jsdom-rendered component tests (including mobile-nav
  open/close and client-side work-filter interaction tests) plus an independent `npm install &&
  npm run build` of an exported sample site in an isolated temp directory outside this
  repository (see "Local sample-export workflow" above — the same scratch-script pattern was
  reused for this family's sample). Open `/templates` in an actual browser before treating the
  visual design as final.

## Product catalog & retail showcase template family

`src/templates/catalog/` is the fifth template family (see [Template families](#template-families)
above), added in Phase 9.4 for small retailers — boutiques, homeware shops, fashion/beauty
brands, and similar businesses that want to showcase a product catalog. Like restaurant, real
estate, and portfolio, it is a single design — a polished independent-boutique register (serif
display face `Playfair Display`, clean grotesk body face `Manrope`, warm linen background with a
dusty-rose accent) distinct from the other four families.

**This is a product discovery and inquiry website, not a storefront.** There is no cart,
checkout, payment processing, or live inventory tracking anywhere in this family's schema or
renderer — a visitor browses, searches, and opens a product's details, then contacts the
business through an explicitly configured channel (email, WhatsApp, phone) to actually buy or
ask about something. Nothing on the site claims an order was placed or a message was delivered.

### Configuration schema and defaulting behavior

`src/templates/catalog/schema.ts` defines `catalogConfigSchema`, mirroring the other four
families' never-throws defaulting pattern, with its own shape: business identity, hero (with a
configurable promo message), a `shop` of products (name, short/full description, category,
price, sale price, images, badges, SKU, a manually-configured availability label, an optional
per-product inquiry link, and free-form attributes like materials/dimensions), a `featured`
collection, `about`, and `contact` (email, phone, WhatsApp, website, social links).
`parseCatalogConfig(input)` never throws, and additionally applies two cross-field
normalizations the schema itself can't express with a single field's `.catch(...)`:

1. Fills in a stable, de-duplicated `slug` per product (derived from its name when one isn't
   supplied) — the same pattern as the real-estate family's listing slugs — used as the
   product's identity for the detail dialog and featured-collection references.
2. Drops a `salePrice` that isn't strictly lower than `price` (including when the two are
   equal), and drops any `featured.productSlugs` entry that doesn't match an actual configured
   product — both silently normalized to the safe/absent state rather than rejecting the whole
   config over one bad cross-field combination. This is what guarantees the featured section can
   never show a phantom item, and a product page can never show a "sale" that isn't actually a
   discount.

Prices are `z.coerce.number().finite().nonnegative()` with `.catch(undefined)` — a negative,
non-finite, or malformed price degrades to "no price" rather than failing the product, and a
product with neither `price` nor `salePrice` simply shows the configurable `shop.noPriceLabel`
(default: "Contact for price") instead of an empty or broken price area.

### WhatsApp number handling

`contact.whatsapp` is validated with the same phone-pattern regex as `contact.phone`, and
normalized into a `wa.me` deep link by `components/links.ts#buildWhatsAppHref`, which strips
everything but digits. **Accepted input**: any common human-written phone format, ideally
including the country code (e.g. `+1 (503) 555-0148` → `wa.me/15035550148`). A number with fewer
than 7 digits after stripping is treated as unusable and the WhatsApp action is hidden rather
than linking to a broken `wa.me/` URL. No business number is ever fabricated — the field is
simply absent (and the action hidden) until a real number is configured.

### Product search, filtering, and the detail dialog

The shop section (`sections/Shop.tsx`) has client-side search (matching product name,
descriptions, and category) and a category filter — plain array filters over the
already-configured `products`, no backend search or external service, mirroring the real-estate
family's listings filter. Filter options are derived from what's actually present in the data; a
"Reset filters" control appears only once a filter is active, and a worded empty state ("No
products match…") replaces an empty grid when nothing matches.

Clicking a product card opens an accessible detail dialog (`sections/ProductDetailDialog.tsx`)
rather than navigating to a routed detail page — the simplest option that works identically in
the factory preview and a static export, with no router dependency. It's a real `role="dialog"`
with `aria-modal`/`aria-labelledby`, focuses its close button on open, closes on `Escape` or a
backdrop click, includes a minimal Tab-wrapping focus trap, and returns focus to whichever
product card triggered it on close (`Shop.tsx` remembers the triggering element). A product's
"enquire about this item" link (`components/inquiry.ts#buildProductInquiryHref`) uses the
product's own `inquiryHref` if set, otherwise falls back to the shared WhatsApp/email/phone
channel with the product's name worked into a URL-encoded message/subject.

### Featured collection

`featured.productSlugs` references real products by slug — any slug that doesn't match an
actual product is dropped at parse time (see above), so this section can never reference a
phantom item, and it's never "just the first N products": it's an explicit, curated subset
chosen in the editor's checkbox list. The section renders nothing at all when the list ends up
empty.

### Sample profile

`sample-data/marlowAndFinch.ts` is "Marlow & Finch," a fictional homeware and lifestyle
boutique — its business details, products, prices, and contact information are all invented for
this sample and are not a real business. Image URLs point at a placeholder host
(`https://images.example.com/...`), exactly like the restaurant and real-estate families'
samples, rather than a real image host whose reachability can't be verified from this
environment — `example.com` is a reserved, non-resolving domain, so these URLs are not claimed
to be reachable; they simply fail to load and `SafeImage`'s fallback (initials on a soft
gradient) renders instead, which is also what any real but temporarily-unreachable product image
would fall back to.

### Standalone rendering boundary

Nothing under `src/templates/catalog/` imports from `api/`, `src/auth/`, or any other
Neon/session-aware module, and it does not import from any other family either — all five
families are siblings. `CatalogTemplate` is the single entry point: given a `CatalogConfig`, it
renders a complete page — including working search, filtering, and the product detail dialog —
with no network calls, no auth check, and no factory chrome.

### Editing in the factory

`src/pages/project-detail/CatalogConfigForm.tsx` is a clean, family-specific editor (several
focused section components under `catalog-sections/`), mirroring the other three non-corporate
families' editors rather than generalizing the corporate `ConfigForm.tsx` — catalog's fields (a
product collection with prices/images/attributes, a featured-product checkbox picker) don't map
onto corporate's sections. Product images/badges/attributes use simple newline- or
comma-separated text areas rather than a richer repeating-field UI, consistent with how the
other families handle small lists. `ProjectDetailPage.tsx` picks which editor to render based on
the draft config's `family` tag.

### Known limitations

- No runtime icon library is used in the catalog nav either, for the same reason as the
  restaurant, real-estate, and portfolio families' (see their own "Known limitations").
- The product editor's images/badges/attributes fields are plain text areas (one value per
  line/comma) rather than a richer repeating-field UI — functional, but less polished than a
  dedicated add/remove control per image; a nicer editor could be built later without changing
  the underlying schema.
- Sample images point at a placeholder host, not real assets — **this template is not
  production-ready as shipped**; replace every `imageUrl` with a real, publicly-accessible
  `https://` URL before using it for an actual catalog.
- Like the other four families, no live browser/visual QA tool was available in this
  environment; verification relied on jsdom-rendered component tests (including keyboard-driven
  product-detail-dialog open/close/focus-return tests, and search/filter/reset interaction
  tests) plus an independent `npm install && npm run build` of an exported sample site in an
  isolated temp directory outside this repository (see "Local sample-export workflow" above).
  Open `/templates` in an actual browser before treating the visual design as final.

## E-commerce storefront template family

`src/templates/ecommerce/` is the sixth template family (see [Template families](#template-families)
above), added in Phase 9.5. It extends the catalog family's product-discovery model with a full
demonstration shopping journey: search/filter → product detail with variants → cart → a
simulated checkout. **The `catalog` family's purpose is unchanged** — it remains a
discovery/inquiry site with no cart; `ecommerce` is a separate family for projects that want to
demonstrate the complete flow.

**This is a demo, not a commerce backend.** There is no real payment processing, no real order
persistence, and no server of any kind behind the cart or checkout — see "Demo-only design" below
for the specific guarantees, and "Future Paystack/Stripe integration boundary" for what a real
integration would still need to add.

### Configuration schema

`src/templates/ecommerce/schema.ts` defines `ecommerceConfigSchema`, extending the catalog
family's product shape with **variants** (named option groups like `Size: [S, M, L]`, validated
against `options.min(1)` so an empty variant can't be configured), a **demo stock status/quantity**
per product (explicitly documented as demonstration data, never a real inventory system), a
**featured** flag per product (simpler than catalog's separate slug list, since every product
already carries its own flag here), and a `checkout` section (shipping options, the demo-notice
text, and the confirmation-screen message — all configurable, so the honesty disclosures are
real content a project owner can see and edit, not something hardcoded past their control).
`parseEcommerceConfig(input)` never throws, and applies the same cross-field normalizations as
the catalog family's parser: a stable, de-duplicated slug per product, and a `salePrice` dropped
whenever it isn't strictly lower than `price`.

### The cart: pure logic, React wiring, and persistence

`components/cart.ts` holds every cart calculation as **pure, dependency-free functions** —
`addLine`, `updateLineQuantity`, `removeLine`, `reconcileCart`, `computeCartTotals`, and friends —
so the whole cart model is unit-testable without rendering anything, and is exactly the same code
whether it runs in the factory preview or a static export. All money math works in **integer
minor currency units** (cents) via `components/currency.ts#toMinorUnits`/`fromMinorUnits`, never
floating-point dollars, so line totals and the checkout total can never drift from
`0.1 + 0.2 !== 0.3`-style rounding error.

`components/CartContext.tsx` (`CartProvider`) is the only place that wires this pure logic to
React state and to `window.localStorage`. On mount, it loads whatever was previously persisted
and immediately runs it through `reconcileCart` against the **current** product list — a line
whose product no longer exists, whose variant selection no longer matches that product's
configured options, or whose product has since gone out of stock is dropped; a line whose
quantity now exceeds a reduced demo stock limit is clamped down, not dropped. The same
reconciliation re-runs if the product list itself changes while mounted (e.g. a different saved
version loaded into the live preview) — handled as a plain state comparison during render
(React's own documented "adjusting state when a prop changes" pattern), not an effect, so there's
no extra render pass and no `setState`-in-effect cascade. The versioned storage key
(`wf-ecommerce-cart-v1`) holds **only** product slug, variant selection, and quantity — see
"Customer data" below for what it deliberately never holds.

### Product detail, variants, and add-to-cart

`sections/ProductDetailDialog.tsx` mirrors the catalog family's accessible dialog pattern exactly
(role="dialog", focuses its close button on open, closes on Escape or a backdrop click, a
minimal Tab-wrapping focus trap, returns focus to the triggering product card on close), extended
with an image gallery (thumbnail strip swaps the main image) and variant selection (one
`radiogroup` per configured variant, defaulting to each variant's first option so a selection is
always valid). A product card offers a one-click "Add to cart" only when it has no variants and
is addable (priced and not out of stock); a product with variants or no price instead opens the
detail dialog, where the actual Add to Cart action lives. A product that's out of stock never
shows an Add to Cart action anywhere — see `components/cart.ts#canAddToCart`.

### Simulated checkout

`checkout/CheckoutDialog.tsx` is a dialog, not a route — same reasoning as the product detail
dialog: no router dependency, identical behavior in the factory preview and a static export. It
steps through `contact` → `shipping` → `review` → `payment` → `confirmation`
(`checkout/types.ts#CheckoutStep`), with real required-field validation at each step
(`checkout/ContactStep.tsx`, `checkout/ShippingStep.tsx`) and a review screen
(`checkout/ReviewStep.tsx`) showing the actual cart contents, subtotal, shipping cost, and total
computed from `useCart().totals`.

**Payment step** (`checkout/PaymentStep.tsx`): Paystack and Stripe are shown as payment method
options, both disabled and labeled "coming soon — not available in this demo." Neither is
selectable, no SDK is loaded for either, and no network request is made to either provider. The
only completable path is an explicitly labeled "Demo checkout (no payment taken)" option. The
confirmation screen (`checkout/ConfirmationStep.tsx`) shows a **simulated order reference**
(`checkout/orderReference.ts` — a cosmetic, client-side-only string like `DEMO-MVPGJDUM-NISD`,
never persisted or sent anywhere) and the project's configured `confirmationMessage`/`demoNotice`
text. It never says "payment successful" or "order placed" — only that a simulated order preview
completed. Completing the demo clears the cart (exactly like a real checkout would), and "Return
to store" closes the dialog.

### Demo-only design (what this family deliberately does not do)

- **No real payment**: no card number, CVV, bank account, or mobile-money PIN field exists
  anywhere in this family. No payment session of any kind is created.
- **No real order**: nothing is written to a database or sent to a server — there is no backend
  for this family to call. The "order reference" on the confirmation screen is cosmetic.
- **No customer data retention**: `checkout/CheckoutDialog.tsx`'s own component state is the
  *only* place contact name/email/phone and the delivery address ever exist. They are never
  passed to `CartContext`, never written to `localStorage`, never logged to the console, and
  never appear in a URL. Closing the dialog for *any* reason (cancel, Escape, or completing the
  demo) unmounts it, which discards that state automatically — there's no separate "clear" step
  to forget.
- **No fabricated inventory claims**: stock status/quantity is whatever a project configures,
  rendered as-is; this family never infers, decrements against real sales, or displays a
  countdown implying scarcity that isn't explicitly configured.

### Future Paystack/Stripe integration boundary

This phase intentionally keeps the real-payment seam small and explicit rather than building a
generic payment-provider abstraction with no immediate user: `checkout/PaymentStep.tsx` is the
one component that would need new, real options added to it, and `checkout/CheckoutDialog.tsx`'s
`handleComplete` is the one place that would need to call a real "create payment session" step
instead of immediately generating a cosmetic reference and clearing the cart. Before this family
could accept a real payment or order, a production integration would still need to add (none of
which exists today, and none of which this phase adds):

- Server-side re-validation of prices and stock at the moment of checkout (never trust client
  totals for a real charge).
- Persisted orders (a real database table, not `localStorage`).
- Provider-specific payment-session creation (Paystack/Stripe server SDK calls, API keys as
  server-side secrets, never shipped to the browser).
- Signature-verified webhooks to confirm payment status server-side, with idempotent handling
  (a webhook retried or delivered twice must never double-fulfill an order).
- Payment-status reconciliation between the client's view of an order and the provider's
  authoritative state.
- Secure server-side handling of customer data (this phase's "never persist it client-side"
  guarantee would need a server-side equivalent, not just removal of the guarantee).

### Sample profile

`sample-data/northfieldSupplyCo.ts` is "Northfield Supply Co.," a fictional outdoor-lifestyle
goods brand — its products, prices, stock levels, and testimonials are all invented for this
sample and are not a real business; the testimonials are explicitly labeled "(illustrative
example)." Image URLs point at a placeholder host (`https://images.example.com/...`), exactly
like the restaurant/real-estate/catalog families' samples, rather than a host whose reachability
can't be verified from this environment.

### Standalone rendering boundary

Nothing under `src/templates/ecommerce/` imports from `api/`, `src/auth/`, or any other
Neon/session-aware module, and it does not import from any other family either — all six
families are siblings. `EcommerceTemplate` is the single entry point: given an `EcommerceConfig`,
it renders a complete page — including a working cart and checkout simulation — with no network
calls, no auth check, and no factory chrome. The exported site's `package.json` ships only
`react`/`react-dom`/`zod` as runtime dependencies, same as every other family; no new dependency
was needed for the cart (plain React state + `localStorage`) or its storage validation (`zod`,
already a dependency).

### Editing in the factory

`src/pages/project-detail/EcommerceConfigForm.tsx` is a clean, family-specific editor (several
focused section components under `ecommerce-sections/`), mirroring the other non-corporate
families' editors — this family's fields (products with variants/stock/pricing, shipping
options, demo checkout wording) don't map onto corporate's sections. Variants and attributes use
simple one-per-line text areas (`"Size: S, M, L"`, `"Material: Merino wool"`), consistent with
how the catalog editor handles small nested lists. `ProjectDetailPage.tsx` picks which editor to
render based on the draft config's `family` tag.

### Known limitations

- No runtime icon library is used in the ecommerce nav either, for the same reason as the other
  non-corporate families' (see their own "Known limitations").
- The product editor's variants/attributes/images fields are plain text areas rather than a
  richer repeating-field UI — functional, consistent with the catalog editor's approach, but less
  polished than a dedicated add/remove control per variant option.
- Sample images point at a placeholder host, not real assets — **this template is not
  production-ready as shipped**, and neither is its checkout: replace every `imageUrl` before
  using it for an actual store, and do not attempt to accept real payments without the
  production work described above under "Future Paystack/Stripe integration boundary."
- No live browser/visual QA tool was available in this environment; verification relied on
  jsdom-rendered component tests — including a full simulated checkout walkthrough (contact →
  shipping → review → payment → confirmation), cart persistence/reconciliation across a
  component remount, and an explicit assertion that no customer-entered text ever appears in
  `localStorage` — plus an independent `npm install && npm run build` of an exported sample site
  in an isolated temp directory outside this repository (see "Local sample-export workflow"
  above). Open `/templates` in an actual browser, at both viewport sizes, before treating the
  visual design or checkout flow as final.

## Client project manager

Phase 4 turns the `projects` / `project_config_versions` tables from Phase 2's schema into a real,
single-owner project manager at `/projects` — list, create, edit, configure, and archive/restore,
all persisted in Neon.

**No new migration was needed.** The Phase 2 schema already had everything this phase requires:
`projects.status` already allows `'draft'`/`'archived'` for the active/archived split, `slug` was
already `unique`, and `project_config_versions` already enforced one row per
`(project_id, version_number)` with immutable JSONB. If a future phase needs new columns, add a
new file in `migrations/` (never edit `0001_init.sql` after the fact) and apply it with
`npm run db:migrate` — never automatically, and never against production from this app's own code.

### Project lifecycle

- **List** (`GET /api/projects?status=active|archived&limit=&offset=`): active means status in
  `draft`/`ready`/`deployed`; archived is its own filter. Paginated with a simple offset/limit —
  the total count comes from a `count(*) over()` window function in the same query, so listing
  is always one round trip.
- **Create** (`POST /api/projects`): builds the project's starting `CorporateConfig` from the
  existing corporate schema (`parseCorporateConfig`, not a competing shape) and inserts the
  project row and its version-1 config row in **one compound SQL statement** (see below) — never
  a half-created project.
- **Edit metadata** (`PATCH /api/projects/detail?id=`): name, business name, slug, and
  archive/restore (`status: 'draft' | 'archived'` — no other status is accepted from the client).
- **Configure** (`GET`/`PUT /api/projects/config?id=`): the structured settings form in
  `src/pages/project-detail/` — grouped sections (business & variant, hero, brand colors, about,
  services, contact, section visibility, SEO), not a long undifferentiated form. Phase 5 (below)
  pairs this form with a live preview of the same draft.
- **Version history & restore** (`GET /api/projects/config?id=&version=`,
  `POST /api/projects/config?id=&version=` to restore): shown on the project's History tab.

### Why a single compound SQL statement instead of a multi-statement transaction

The Neon serverless driver's HTTP mode (`neon()`, used throughout `api/_lib/db/`) sends one query
per HTTP request with no persistent connection to `BEGIN`/`COMMIT` across several calls — that's
exactly what makes it safe to treat as a stateless singleton (see Phase 2's README notes). So
instead of a client-side multi-statement transaction, atomic multi-table writes here use a single
statement built from data-modifying CTEs, e.g. project creation
(`api/_lib/db/queries/projects.ts#createProjectWithConfig`):

```sql
with new_project as (
  insert into projects (...) values (...) returning id, ...
),
new_version as (
  insert into project_config_versions (project_id, version_number, config)
  select id, 1, $config::jsonb from new_project
  returning ...
)
select ... from new_project, new_version
```

Postgres executes the whole statement atomically, so either both rows exist or neither does —
with no need to switch to a connection-based driver just for this one operation.

### Version numbering and concurrency

Saving a new configuration version computes `version_number` as
`coalesce(max(version_number), 0) + 1` inside the same `INSERT` — not read-then-write from the
application. Two concurrent saves can still race to compute the same next number; when that
happens, the `project_config_versions` table's `unique (project_id, version_number)` constraint
(from Phase 2) rejects the loser with a Postgres unique-violation, which the API turns into a
`409 Conflict` ("Someone else saved a newer version. Reload and try again.") instead of silently
overwriting history. This is "concurrency-safe to the extent the stateless HTTP driver
supports" — honest about the one race window (two saves reading the same "unchanged?" comparison
before either writes) rather than claiming full serializability.

A save is **skipped** (no new version row, `changed: false` in the response) when the submitted
config, after normalization, is identical to the current latest version — editing a project's
name doesn't create a pointless configuration version, and re-saving the configuration form
without changing anything doesn't either.

### Validation

- `variant` is checked against `['premium', 'neutral']` and rejected outright (`400`) if it's
  anything else — unlike most config fields, which normalize bad values to a default (see Phase
  3's README), a variant is structural enough that silently swapping it would be surprising.
- Everything else in a saved config goes through the same `corporateConfigSchema` from Phase 3:
  unsafe links become `'#'`, invalid colors reset to their default, and so on — see that
  section's "Configuration schema and defaulting behavior" above.
- `slug` is validated against a strict `^[a-z0-9]+(?:-[a-z0-9]+)*$` pattern server-side
  (`api/_lib/projectValidation.ts`); the create form's live slug suggestion is a client-side
  convenience only — the server never trusts it and re-validates and uniqueness-checks
  independently.

### Known limitations

- Archiving/restoring only toggles between `draft` and `archived`; `ready`/`deployed` are reserved
  for the deployment phase and aren't reachable from this phase's UI.
- The "unchanged config" check and the version-number race described above both have a narrow
  benign window under true concurrent edits from two browser tabs; the result in the worst case
  is an extra, otherwise-correct version row — never corrupted or lost history.
- This environment has no live browser tool, so the project manager's UI was verified with jsdom
  component tests (`src/pages/*.test.tsx`) and a live `/api/health` check against the already-
  configured Neon database (confirmed "connected"), not a real browser click-through. Create and
  edit a project in an actual browser, in both factory themes and at a narrow viewport, before
  treating this phase as visually final.

## Live preview & visual customization editor

Phase 5 upgrades the project editor's **Configuration** tab (`src/pages/ProjectDetailPage.tsx`)
into a split workspace: the same configuration form from Phase 4 on one side, and a live preview
of the exact same draft, rendered through the real corporate template, on the other. No new API
endpoint and no new database migration were needed — this phase is entirely about how the
existing draft state reaches the existing renderer.

### How the live preview works

The preview is the same `/templates/preview` route the Phase 3 showcase uses
(`src/pages/TemplatePreviewPage.tsx`), given a second way to receive its config:

- **Showcase mode** (unchanged): `?profile=&variant=` in the URL. Switching selections reloads
  the iframe — fine for a deliberate dropdown choice.
- **Draft mode** (new): `?mode=draft`. The config itself never goes in the URL. Instead, the
  editor's `LivePreviewPanel` (`src/pages/project-detail/LivePreviewPanel.tsx`) talks to the
  iframe over `window.postMessage`, same-origin only on both ends (see
  `src/components/preview/previewMessages.ts`):
  1. The iframe posts `{ type: 'wf-preview-ready' }` to its parent once its own message listener
     is attached (a standard handshake — posting before that listener exists would be a lost
     message).
  2. The panel waits for that, then posts `{ type: 'wf-preview-config', config }` once immediately
     and again on every subsequent keystroke. The iframe's `src` never changes while editing, so
     there's no reload flicker, and the config travels as a plain object (no HTML, nothing
     executable) through a channel that already requires matching origins on both sides.
  3. Inside the iframe, the received config is passed through the same never-throwing
     `parseCorporateConfig` used everywhere else before rendering — an invalid color or link
     typed mid-edit normalizes instead of crashing the preview.
  4. If the handshake doesn't complete within 8 seconds (e.g. the iframe failed to load), the
     panel shows an inline error with a "Reload preview" action instead of a silent blank frame.

This reuses the existing standalone render path end to end: `CorporateTemplate` never knows
whether its config arrived via a URL, a sample profile, or postMessage.

### Desktop/mobile preview modes

The same `ViewportToggle` component (extracted from the Phase 3 showcase, which now uses it too)
switches the iframe between full width and a fixed 390px mobile width. This only changes the
iframe's CSS `width` — it never remounts the iframe or touches the postMessage channel, so
switching modes can't reset the draft or trigger a save.

### Save and dirty-state behavior

- The last **saved** config (`versions[0].config`) is the baseline; the editor's `draft` state is
  a separate, independent value. Typing only ever calls `setDraft` — never a network request.
- **Save** validates (`variant` is rejected outright if unsupported; everything else normalizes —
  see Phase 4's "Validation" section above) and persists through the existing
  `PUT /api/projects/config` endpoint, which still only creates a new version when the normalized
  config actually differs from the latest one.
- **Race safety**: if the user keeps typing while a save is in flight, the response handler
  checks whether the draft is still the exact object that was submitted. If it is, the draft is
  replaced with the server's (re-normalized) version and the status reads "Saved." If the user
  edited again in the meantime, the draft is left alone (nothing is clobbered), the version
  history still advances, and the status correctly falls back to "Unsaved changes" — it never
  claims the newer edits are saved when they aren't.
- **Failed saves** leave the draft exactly as the user left it and show the server's error
  message instead of a generic failure.
- **Unsaved-change navigation warning**: `src/navigation/UnsavedChangesProvider.tsx` tracks a
  single app-wide "is something dirty right now" flag. It drives the browser's native
  `beforeunload` confirmation for tab close/reload, and `GuardedLink`/`GuardedNavLink` (used by
  the sidebar, mobile nav, and this page's own "Back to projects" links) ask
  `window.confirm(...)` before any in-app navigation while dirty. This exists because the app
  uses a plain `<BrowserRouter>`, not a data router — react-router's own `useBlocker` navigation
  API requires a data router (`createBrowserRouter`), which this app doesn't use, so a
  confirm-based guard is the safest equivalent without changing the router setup for one feature.
- **Restoring a version** while the draft is dirty asks for confirmation first (restoring
  replaces the draft, so it would otherwise silently discard unsaved edits).

### Isolation

Nothing new was needed here: the corporate template's CSS (Phase 3's `tokens.css` files) was
already scoped under `.wf-corporate--<variant>` and deliberately not keyed to the factory's
`[data-theme]` attribute, and the preview already rendered in its own iframe document. Switching
the factory dashboard between light and dark has no code path that can reach the iframe's
document at all, let alone the corporate template's fixed-palette CSS inside it.

### Known limitations

- The "editing during an in-flight save" and "unchanged save" safety nets are unit-tested by
  mocking fetch and the postMessage channel directly (see
  `src/pages/ProjectDetailPage.test.tsx`, `src/pages/project-detail/LivePreviewPanel.test.tsx`,
  `src/pages/TemplatePreviewPage.test.tsx`) — jsdom does not execute a real nested document inside
  an `<iframe>`, so these tests verify each side of the postMessage contract independently rather
  than a true cross-document round trip. A real browser check (see Manual verification below) is
  the way to confirm the full path end to end.
- The unsaved-changes guard covers in-app navigation through `GuardedLink`/`GuardedNavLink` and
  browser-level close/reload/refresh. It does not cover every conceivable way to leave the page
  (e.g. typing a new URL directly) — `beforeunload` does cover that case, but anything that
  doesn't trigger either mechanism (there isn't one in this app) would not be guarded.

## Standalone website export (ZIP)

Phase 6 adds an **Export website** action to the project detail page: it downloads the
project's latest *saved* configuration as a ZIP containing a complete, independent Vite +
React + TypeScript project — one that builds and runs with no connection to Website Factory,
its database, or its authentication at all.

### What's in the ZIP, and why

```
riverside-landscaping.zip
├── README.md              ← setup/build/deploy instructions for this specific export
├── package.json            ← only react, react-dom, zod + Vite/Tailwind/TS tooling
├── index.html
├── tsconfig.json / vite.config.ts / .gitignore
└── src/
    ├── main.tsx             ← bootstraps React
    ├── App.tsx              ← renders <CorporateTemplate config={siteConfig} />
    ├── site-config.ts        ← this project's saved config, as a typed constant
    ├── styles.css            ← just `@import 'tailwindcss'` + a margin reset
    └── templates/corporate/  ← verbatim copy of src/templates/corporate/
```

That last folder is the key design decision: rather than re-implementing or "carefully
extracting" a trimmed renderer, the export ships the **exact same files** this factory itself
uses to render both variants (`schema.ts`, `CorporateTemplate.tsx`, `components/`, and both
`variants/premium/` and `variants/neutral/` in full — the project's own selected variant is
just which one `CorporateTemplate`'s switch picks at render time). This is only possible
because Phase 3 already built that folder to have zero dependency on `api/`, `src/auth/`, or
any Neon/session-aware code — see "Standalone rendering boundary" above. Nothing needed to
change there for this phase.

### Keeping the bundled copy in sync: `scripts/buildExportManifest.ts`

The export API handler can't reliably read arbitrary sibling source files at request time —
once deployed to Vercel, a serverless function only reliably has what its own build step
traced as an import, not arbitrary filesystem reads. So `scripts/buildExportManifest.ts` reads
every real file under `src/templates/corporate/` (excluding `__tests__/`, `sample-data/`,
`registry.ts`, and `index.ts` — factory-only pieces an exported site has no use for) and writes
their contents as plain string constants into `api/_lib/export/templateFiles.generated.ts`,
which the export handler then `import`s normally, like any other module. That generated file is
committed to git and also regenerated automatically via the `predev`, `pretest`, and `prebuild`
npm scripts, so it can never silently drift from the real template source during development, and
a deployment built straight from a commit still has an up-to-date copy regardless of build-step
ordering, since what's committed is what ships. Regenerate it manually with
`npm run export:build-manifest` any time you want to confirm it's current without running
dev/test/build.

### ZIP library: `fflate`

No ZIP library was already installed. `fflate` was added (one new dependency) — it's a small,
actively maintained, dependency-free library whose `zipSync`/`unzipSync` work entirely in
memory on plain `Uint8Array`s, which fits a serverless function perfectly: no temp files, no
filesystem assumptions, synchronous (no stream plumbing to manage under a request's lifetime).

### Request flow and why it's a plain `GET`

`GET /api/projects/export?id=<uuid>` — protected by the same `withAuth` every other endpoint
uses, requiring a valid session cookie. It's deliberately `GET`, not `POST`:

- A file download is naturally triggered by browser navigation or a plain `fetch`, neither of
  which can attach a custom header — so it can't carry the app's CSRF header the way mutating
  requests do.
- That's fine, because `GET` requests are already exempt from this app's CSRF checks (see
  `api/_lib/auth.ts#withAuth`): they're expected to be side-effect-free, and exporting
  genuinely is — it only reads an already-saved configuration and transforms it. No existing
  security property had to be weakened to support this.

The frontend (`src/pages/project-detail/ExportPanel.tsx`) still uses `fetch` rather than a bare
`<a href>`, specifically so it can show real loading/error state and block a second click while
one export is already in flight — a plain anchor click gives no such hook.

### Safety

- **Every ZIP entry path is a fixed string literal or comes from the pre-generated template
  file manifest.** Project-controlled data (name, slug, business name, every config field)
  only ever ends up inside file *contents* (`site-config.ts`, `index.html`, `README.md`) —
  never in an archive path — so there is no path-traversal surface regardless of what a
  project's saved data contains.
- **The saved config is re-validated with the same `parseCorporateConfig`** used everywhere
  else immediately before export, and again at the exported site's own startup (belt and
  suspenders) — an unsafe link normalizes to `'#'`, an invalid color resets to its default,
  exactly as it already does inside the factory. A corrupted or unexpected stored value
  produces a safe default site rather than a crash.
- **The config is embedded as a JSON object literal**, never interpolated into a template
  string or executed — `JSON.stringify` already escapes quotes, backslashes, and all Unicode
  correctly for a JS/TS literal.
- **`index.html`'s title/description are HTML-escaped** (`api/_lib/export/sanitize.ts`) before
  being embedded, since those come from project-controlled SEO/business fields being placed
  directly into HTML markup.
- **The ZIP filename is independently re-sanitized** from the project's slug
  (`sanitizeFilenameSegment`) even though slugs are already constrained at creation time — this
  endpoint doesn't trust that upstream validation alone, and falls back to a safe default
  (`website.zip`) if sanitizing somehow leaves nothing.
- **No server-side image fetching.** Logo/hero/highlight images that are external URLs are
  referenced as-is (already constrained to `https://` by the existing schema) — the server
  never fetches them, avoiding any SSRF surface. The exported README explains this and how to
  replace them; the template's existing `SafeImage` fallback already means a dead image link
  degrades to a placeholder rather than breaking the page.

### Known limitations

- Dependency versions in the generated `package.json` (React, Vite, Tailwind, TypeScript, Zod)
  are deliberately pinned to match what this factory currently uses
  (`api/_lib/export/generateFiles.ts`), not read from `package.json` at request time. If the
  factory's own versions are bumped later without updating that file, newly generated exports
  would still reference the older pinned versions until it's updated by hand.
- Exported sites load their Google Fonts the same way the factory itself does — over the
  network at page load. If that request fails, every section already falls back to a system
  font stack (see each variant's `tokens.css`), so layout and readability are unaffected, only
  the exact typeface.
- The full "extract → `npm install` → `npm run build` → serve → confirm content" verification
  (both variants) was performed manually in this environment using
  `scripts/exportSample.ts` (a manual helper, not wired into any other script) against a
  fictional project, rather than through the live authenticated UI with a real Neon-backed
  project — this environment has no stored admin credentials to drive the real login flow. The
  generated ZIP in both cases is produced by the exact same `buildExportZip()` function the real
  API endpoint calls, so this is a faithful test of the artifact itself.

## Vercel deployment integration

Phase 7 adds a **Deploy to Vercel** section to the project detail page: the administrator can
create a preview or production deployment of a project's latest *saved* configuration directly
from Website Factory, watch its status, and open the live URL once it's ready — without the
Vercel CLI, a GitHub repository, or ever leaving the app.

### Migration: `migrations/0002_deployments.sql` — why it was genuinely necessary

The Phase 2 schema's `deployment_records` table already existed but couldn't support this
phase without changes:

- `projects` had nowhere to remember *which* Vercel project a given factory project is linked
  to, so a second deployment of the same project would have had no way to find and reuse the
  first one's Vercel project — every deploy would have created a new one. Added
  `projects.vercel_project_id` (nullable `text`).
- `deployment_records` had no `environment` column — preview and production are a different
  axis from `status` (pending/building/success/failed) and both need to be visible in history.
  Added `deployment_records.environment` (`'preview' | 'production'`, defaulting to `'preview'`).
- `deployment_records` had no link back to *which saved configuration version* was deployed.
  Added `deployment_records.config_version_id` (nullable, references
  `project_config_versions`, `on delete set null`).

The migration only adds nullable/defaulted columns — forward-only, safe to run against a
database that already has `0001_init.sql` applied, and it was not run against the real database
as part of implementing this phase (see [Manual verification](#manual-verification-windows-powershell)
below for exactly how to run it yourself).

### Architecture: one Vercel API call creates the project, uploads the files, and deploys

Verified against the current Vercel REST API docs (`/docs/rest-api/reference/endpoints/deployments/...`)
before implementing. Non-Git deployments are created with:

```
POST https://api.vercel.com/v13/deployments?skipAutoDetectionConfirmation=1
Authorization: Bearer <VERCEL_TOKEN>
{
  "name": "wf-riverside-landscaping",      // first deployment of a project — Vercel
                                             // creates (or reuses, by this exact name)
                                             // a Vercel project with this name
  // or, once we know the Vercel project id from a prior deployment:
  "project": "prj_...",
  "files": [{ "file": "src/main.tsx", "data": "<base64>", "encoding": "base64" }, ...],
  "projectSettings": { "framework": "vite" },
  "target": "production"                    // omitted entirely for a preview deployment
}
```

This is a single call that implicitly creates the Vercel project (if one by that name doesn't
already exist), uploads every file inline as base64 (no separate file-upload step — all of the
generated site's files are small text, well within what the API supports inline), and starts
the build, returning immediately with `readyState: "QUEUED"`. Status is then polled via
`GET /v13/deployments/{id}` until it reaches a terminal state (`READY` or `ERROR`/`CANCELED`).

**Why this avoids the "project created but file upload failed" partial-failure case** the brief
specifically calls out: that failure mode is only possible in a workflow with *separate*
project-creation and file-upload steps. Because project creation, file upload, and deployment
creation are all one atomic Vercel API call here, there is no such intermediate state to handle
— either the whole call succeeds (and we learn the project id, deployment id, and initial status
together) or it fails outright (and nothing was created on our side beyond the `pending`
`deployment_records` row written just before the call).

### Reusing the same Vercel project across deployments

`api/_lib/deployment/deployProject.ts#startDeployment`:

1. If `projects.vercel_project_id` is already known for this factory project, the deployment
   request targets it directly via `project: <id>` — the precise, preferred way.
2. Otherwise, it uses a **deterministic name**, `wf-<project-slug>`. Vercel's own project-name
   uniqueness means a second deployment that passes the same name lands on the *same* Vercel
   project rather than creating a duplicate — so even a retry after a failure that happened
   before we learned the project id still can't create a second project.
3. Once a deployment succeeds, the Vercel project id it reports is written to
   `projects.vercel_project_id` (if not already set) — so from then on, every subsequent
   deployment of that project uses the precise id from step 1.

### API: `GET`/`POST /api/projects/deploy?id=<uuid>`

One file, consolidating three listed capabilities (start a deployment, check status, list
history) into two methods, the same way `projects/config` already consolidates several
Phase 4/5 operations:

- **`POST`** — starts a deployment. Body is `{ environment: 'preview' | 'production' }`
  (defaults to `'preview'`) — nothing else. It never accepts configuration content from the
  request; the handler always re-fetches the project's latest *saved* version from the database
  itself (`getProjectVersions`), so an unsaved editor draft can never reach a deployment. Requires
  authentication and CSRF (it's a mutating `POST`, following the app's existing convention).
  Returns a clear `503` (naming `VERCEL_TOKEN`, no other detail) if deployment isn't configured,
  before touching the database at all.
- **`GET`** — returns `{ configured, vercelProjectId, deployments }`. Any history row still
  `pending`/`building` is polled against the live Vercel API before being returned, which is
  what lets this one method double as "check status" — the frontend doesn't need (and this app
  doesn't have) a separate status-check endpoint. Read-only, so no CSRF needed, consistent with
  every other `GET` in this app.

### Vercel API client (`api/_lib/vercel/client.ts`)

- Bearer auth, HTTPS, a fixed base URL (`https://api.vercel.com`) — the browser can never
  supply or influence the upstream URL; only a validated project id (UUID) ever reaches the
  server, and only a validated deployment id (`dpl_...` pattern) is ever used to build a Vercel
  API path.
- A 20-second timeout via `AbortController` on every request; no retry loop anywhere — a failed
  attempt is reported as failed, and trying again is the administrator's own deliberate action
  (another click), never automatic.
- Every response is parsed with a Zod schema before anything reads it — an unexpected or
  incomplete shape becomes a sanitized `invalid_response` error, never a false "success".
- `401`/`403` → `auth`, `404` → `not_found`, `409` → `conflict`, `429` → `rate_limited`, `5xx` →
  `upstream`, network failure → `network`, abort → `timeout` — each mapped to a short, fixed,
  non-leaking message. The raw upstream response body is never returned to the browser or
  thrown in an error, only (truncated, and still never including the token, which only ever
  appears in the outgoing `Authorization` header) written to the server log.
- A defensive 5MB cap on the total upload (the real generated sites are tens of KB) and a 2MB
  cap on how large a Vercel response body this client will read.

### Reusing Phase 6's generation logic, not a second implementation

`api/_lib/export/buildSiteFiles.ts` (extracted from `buildExportZip.ts` in this phase) is the
one shared implementation: ZIP export zips its output, and deployment base64-encodes the same
output's files for the Vercel API — the same file paths, the same `parseCorporateConfig`
re-normalization, the same safe-link/safe-color rules, and the same path-traversal-proof design
(every entry path is a fixed literal or from the pre-generated template manifest; project data
only ever ends up in file *contents*). Both corporate variants deploy correctly because both are
always included in the generated site's `src/templates/corporate/variants/` — see Phase 6's
section above for why.

### Deployment environment vs. production promotion

- **Preview is the default** everywhere in the UI — the production button is visually distinct
  (styled as a warning action) and requires its own separate confirmation step naming the
  specific implication ("updates the live production website").
- There is no "promote this preview to production" action. The Vercel API's `target` parameter
  is set per deployment-creation call, not applied after the fact to an existing deployment —
  promoting an already-created preview deployment to production is a distinct Vercel capability
  this integration does not implement, so **that limitation is documented here rather than
  simulated**: to update production, the administrator deploys again with the production option
  explicitly selected, which creates a new deployment targeting production.
- Saving a configuration change or restoring a version never deploys anything — deployment is
  always a separate, explicit action from a separate button.

### Known limitations

- **No real Vercel account was used to test this phase.** Every test (listed below) mocks the
  Vercel API — no Vercel project, deployment, or token was created or used. See
  [Manual verification](#manual-verification-windows-powershell) for how to verify against a
  real account.
- **Production promotion isn't supported**, by design — see above.
- An ambiguous outcome (a network/timeout error with no response at all from the initial
  deployment-creation call) can't be reconciled by deployment id, since no id was ever returned
  — the attempt is simply recorded as `failed`, and retrying is safe (see "Reusing the same
  Vercel project" above) but will create a genuinely new deployment, not resume the uncertain
  one.
- Deployment status is only refreshed when the project detail page's deployment section is open
  (on load, and by polling every 4 seconds while something is building) — there's no background
  job keeping history fresh while nobody is looking, which is an intentional simplification
  consistent with "do not add a job queue or scheduler" for a feature this size.

## Manual verification (Windows PowerShell)

```powershell
cd C:\Users\ksom3\WebsiteFactory
```

1. **Configure the token without displaying it** — open `.env.local` in an editor (not a command
   that echoes it) and add:
   ```
   VERCEL_TOKEN=<your token>
   VERCEL_TEAM_ID=<only if using a team token>
   ```
   Save and close the file. (If `.env.local` doesn't exist yet, copy it from `.env.example`
   first and fill in the database/auth variables too — see [Environment variables](#environment-variables).)
2. **Apply the new migration** (adds the Phase 7 columns — see above):
   ```powershell
   npm run db:migrate
   ```
3. **Restart the dev server** so the new environment variables are loaded:
   ```powershell
   npm run dev
   ```
4. **Confirm the integration is detected**: sign in, open any project, and check the "Deploy to
   Vercel" section — it should show the "Deploy preview" / "Deploy to production" buttons
   instead of a "Not configured" message.
5. **Create a preview deployment** for a fictional client project: click **Deploy preview**,
   confirm in the dialog that names the project, version, and variant, and submit.
6. **Watch status reach a terminal state**: the history row shows "Preparing" → "Building" →
   "Ready" (polling automatically every few seconds) or "Failed" with a message.
7. **Open and verify the preview site**: once "Ready", click **Open site** and confirm it shows
   the project's actual saved content and the correct template variant.
8. **Make a saved change**: go to the Configuration tab, edit something (e.g. the hero heading),
   click **Save configuration**, then return and **Deploy preview** again.
9. **Confirm the new deployment uses the new version**: open the new deployment's site and check
   the change is there; the older deployment's URL (still in history) should still show the old
   content.
10. **Confirm history shows both deployments**, each with its own status, environment, and URL.
11. **Test an invalid/missing token safely**: temporarily change `VERCEL_TOKEN` to an obviously
    wrong value (not a real token), restart `npm run dev`, and try **Deploy preview** — it should
    fail with a message like "Vercel rejected the configured token," not a crash or a stack
    trace. Then remove `VERCEL_TOKEN` entirely, restart, and confirm the section shows "Not
    configured" instead of broken deploy buttons. Restore the real token afterward and restart
    again.
12. **Production deployment**: only click **Deploy to production** when you intend to actually
    publish that project's current saved version live — its confirmation step says so
    explicitly. There is no "undo"; deploying again (preview or production) is how you move
    forward from there.

## Deferred to later phases

Phase 2 added the schema, migrations, and protected read endpoints; Phase 3 added the reusable
corporate template and its config contract; Phase 4 added the project manager that creates,
configures, and version-controls projects using that contract; Phase 5 added the live preview
and visual customization editor; Phase 6 added standalone ZIP export of a project's saved
configuration as a buildable, independent website; Phase 7 (above) added direct Vercel
deployment of that same generated website; Phase 8 was a production-readiness audit; Phase 9.1
generalized the architecture to support more than one template family and added the restaurant
family as the second one; Phase 9.2 added the real-estate family as the third; Phase 9.3 added
the portfolio/personal-brand family as the fourth; Phase 9.4 added the product-catalog family as
the fifth; Phase 9.5 (above) added the e-commerce storefront family (with a demo cart and
simulated checkout) as the sixth. The live database was unavailable throughout Phases 9.2–9.5
(see "What Phases 9.2–9.5 could and couldn't verify" below).

**Pending manual steps from Phases 9.1–9.5:** `migrations/0003_restaurant_template.sql`,
`migrations/0004_real_estate_template.sql`, `migrations/0005_portfolio_template.sql`,
`migrations/0006_catalog_template.sql`, and `migrations/0007_ecommerce_template.sql` (each a
single idempotent `insert ... on conflict (id) do nothing`, registering the `'restaurant'`,
`'real-estate'`, `'portfolio'`, `'catalog'`, and `'ecommerce'` template ids respectively) have
been written and tested but **not applied** to any database — 0003 because that was Phase 9.1's
explicit instruction, and 0004–0007 because the live database was unreachable throughout Phases
9.2–9.5, not because applying them was deferred by choice. Run `npm run db:migrate` against a
reachable database when ready — it auto-discovers every `*.sql` file under `migrations/` and
only applies the ones not yet recorded in its own `schema_migrations` tracking table, so running
it once picks up all five pending migrations; no other migration is re-run. Until all five are
applied, creating a project with `family: 'restaurant'`, `family: 'real-estate'`,
`family: 'portfolio'`, `family: 'catalog'`, or `family: 'ecommerce'` will fail with a
foreign-key error from `projects.template_id`, since none of those rows exist in `templates`
yet — corporate project creation is completely unaffected.

### What Phases 9.2–9.5 could and couldn't verify

The database was unavailable for the entirety of all four phases. Everything reported for them
was verified at the **code level only**, with no live-database step attempted:

- **Verified (code level, no database needed):** schema validation/defaults (unit tests against
  Zod schemas directly), component rendering and interaction (jsdom + Testing Library against
  the real-estate, portfolio, catalog, and ecommerce renderers directly, including mobile-nav
  open/close, client-side search/filter interaction tests, keyboard-driven product-detail-dialog
  tests, and — new in Phase 9.5 — pure unit tests of every cart operation
  (`src/templates/ecommerce/components/__tests__/cart.test.ts`) plus a full simulated
  contact→shipping→review→payment→confirmation checkout walkthrough and an explicit assertion
  that no customer-entered text ever reaches `localStorage`), the family-resolution/fail-safe
  logic in `parseConfig.ts` (unit tests, including a mocked-SQL-layer test of
  `mapConfigVersion`'s behavior on a corrupted row — see `api/_lib/db/queries/projects.test.ts`),
  API route validation logic (route handlers tested with the db query functions mocked out, so
  no real connection is made), the export/manifest pipeline (`buildExportZip`/`buildSiteFiles`
  are pure functions over an in-memory `Project` object), export-manifest determinism
  (regenerated twice, diffed identical, for every phase), and `npm run lint`/`typecheck`/`test`/
  `build` (the full suite run with `--no-file-parallelism` for a reliable pass on this
  resource-constrained machine — see Phase 9.4's report for why).
- **Also verified, outside the repository:** independently extracting the generated real-estate,
  portfolio, catalog, and ecommerce ZIPs, running `npm install && npm run build` on each in an
  isolated temp directory, and doing the same for fresh exports of Fathom, Willow Creek Dental,
  and the restaurant sample each time to check for regressions — none of this touches a database
  either (see "Local sample-export workflow" above). The ecommerce export was additionally
  checked for the absence of any Stripe/Paystack SDK import or API call, and its `package.json`
  for the absence of either provider's package.
- **NOT verified, and will need a real pass once database access returns:** actually creating a
  real-estate, portfolio, catalog, or ecommerce project through `/projects` end-to-end (the
  create → save → version-history → restore flow against a live `projects`/
  `project_config_versions` table), confirming `migrations/0004_real_estate_template.sql`,
  `migrations/0005_portfolio_template.sql`, `migrations/0006_catalog_template.sql`, and
  `migrations/0007_ecommerce_template.sql` apply cleanly via `npm run db:migrate`, and any manual
  browser/visual QA of the rendered designs — including the ecommerce checkout flow at a narrow
  viewport — (see each family's own "Known limitations"). Reachability of the portfolio sample's
  Unsplash image URLs was also not verified over the network in this environment.
