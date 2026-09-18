# Deploying FLUX

**Live at <https://flux-phy2049.pages.dev> on Cloudflare Pages, public, no login.** That was a
deliberate call: the group is small, a link that just works beats a link that emails people a code,
and Cloudflare Access was skipped on purpose. `public/robots.txt` and `public/_headers` keep the
site out of search results, which is the protection that remains.

## Updating the live site

The Pages project is a **Direct Upload** project, not Git-connected. Pushing to `main` does not
publish anything — a hosted build is a snapshot, and it only changes when someone uploads a new one.
This is the single most important thing to know about this setup: green tests and a merged commit
do not mean the group is looking at that code.

### Shipping a release

```bash
npm run deploy
```

That runs the tests, builds, and uploads `dist` to the Pages project in one go. It does not need
Wrangler installed — `npx` fetches it for that run — but it does need to be authorised once:

```bash
npx wrangler login      # opens a browser, once per machine
```

(A `CLOUDFLARE_API_TOKEN` in the environment works instead, if you'd rather not log in.)

The production URL never changes. Check the first run landed under **Production** rather than
Preview in the dashboard; if it shows as a preview, the project's production branch is named
something other than `main` and the `--branch` flag in the `deploy` script should match it.

The dashboard route still works if you'd rather click: Workers & Pages → `flux-phy2049` →
Deployments → Create new deployment, and upload `dist`.

### Knowing what is actually live

Every build stamps itself with the commit it came from, served at
<https://flux-phy2049.pages.dev/version.json> and logged to the browser console.

```bash
npm run live
```

prints the live commit and the local one, and lists exactly which commits the site is missing:

```
live   dd1a835  Build Ch 38-42 from the practice sheets
       built 2026-09-17T00:00:00Z
local  0dddd21  Record that Pages is Direct Upload, not Git-connected

The live site is 5 commit(s) behind this checkout:
...
```

It exits non-zero when the site is behind, so it can gate something later if that ever matters.
A build made from a checkout with uncommitted changes is stamped `abc1234+local`, which is a
warning in itself: that build does not correspond to anything in the history.

Cloudflare does not convert a Direct Upload project to Git-connected. Auto-deploy on push would mean
creating a *second* Pages project pointed at `DGadapee00/flux-phy2049` (build `npm run build`, output
`dist`) and moving people to its URL — worth it only if republishing by hand starts to hurt.

## How the build works

The app is a static site. `npm run build` writes a `dist/` folder of plain HTML, JS and CSS —
no server, no database, no Node on the other end. Anything that can serve a folder can host it,
and then the app is a URL: your group opens it on a laptop, a Chromebook, a phone, a library
machine, with nothing installed and no terminal.

```bash
npm run build     # writes dist/ (~2.6 MB)
npm run preview   # serves dist/ at http://localhost:4173 to check it first
```

`vite.config.js` sets `base: './'`, so the build works at the root of a domain or in a
subfolder (`.../flux-phy2049/`) without changing anything. Routing is hash-based
(`#/e3/potential`), so there is no server rewrite rule to configure — deep links to a lab
or to a single problem (`#/e4/circuits?p=e4.44.two-loop&s=0`) work as-is.

## What the public build exposes

The bank's problems are generated from our own templates, but their ground-truth `cases`
carry numbers and printed answers taken from Montgomery's worksheets. That material has
deliberately stayed inside a private repo. A hosted build puts the *rendered* version of
it on the open internet — the source files stay private, but anyone with the URL can read
the problems and check the answers.

`public/robots.txt` and `public/_headers` ship with the build and ask search engines to
skip the site, so it will not turn up in a Google search for a problem's wording. That is
a courtesy, not a lock — anyone handed the URL can read everything. Option 3 below is the
route that would change that, and it is the one we chose not to take.

## Other routes, if the current one ever stops suiting

## Option 1 — Netlify Drop (fastest, ~2 minutes, unlisted URL)

No account strictly required, but make a free one or the site expires after 7 days.

1. `npm run build`
2. Open <https://app.netlify.com/drop>
3. Drag the `dist` folder onto the page
4. You get a URL like `https://splendid-tarsier-1a2b3c.netlify.app` — that is the link you send

To update it later: rebuild and drag `dist` again onto the same site's *Deploys* tab.
Rename the site under Site configuration → Change site name if you want something typeable.

Good for: getting the group unblocked today. The URL is public but unguessable, and the
site is marked noindex.

## Option 2 — GitHub Pages (automatic on every push)

`.github/workflows/pages.yml` is still in the repo but does nothing while Pages is off, which is
how it should stay while the site lives on Cloudflare. Turn it on at
**Settings → Pages → Build and deployment → Source: GitHub Actions**, then push to `main`.
Every push rebuilds and republishes; the URL is
`https://dgadapee00.github.io/flux-phy2049/`.

Two caveats:

- **Plan.** Publishing Pages from a *private* repository needs GitHub Pro. On the free plan
  the repo has to be public for Pages to work — which would put the source, including every
  worksheet-derived `case`, on the open internet. That is the thing we agreed not to do.
- **Visibility.** Even on Pro, the *site* is public; only the source stays private. Private
  Pages sites (viewable only by collaborators) are an Enterprise feature.

Good for: never thinking about deployment again, if the repo goes Pro.

## Option 3 — Cloudflare Pages + Access (free, and actually gated)

The only free route that keeps the site to named people. Cloudflare Zero Trust allows up to
50 users at no cost.

1. Build, and upload `dist` at <https://dash.cloudflare.com> → Workers & Pages → Create →
   Pages → Upload assets. (Or connect the repo and let it run `npm run build` with output
   directory `dist`.)
2. In the same dashboard: Zero Trust → Access → Applications → Add a self-hosted
   application, pointed at the `*.pages.dev` hostname.
3. Policy: *Allow* → include → **Emails** → paste your group's addresses.

Visitors get a one-time code emailed to them, then the app. Anyone else gets a wall.

Good for: sharing a build that contains the worksheets' numbers without putting them
where the whole internet can read them.

## After it's live

- **Progress doesn't follow the move.** Mastery is stored in `localStorage` under
  `flux.problems.v1`, which is per-origin. Your work at `localhost:5174` stays there; the
  hosted site starts everyone at zero. That is fine for the group — just don't expect your
  own streak to appear.
- **Fonts come from Google.** `index.html` pulls Inter and JetBrains Mono from
  `fonts.googleapis.com`. On a network that blocks it the app still works, just in fallback
  type. Vendoring the two fonts into `public/` would remove the dependency.
- **Updating means rebuilding.** The hosted copy is a snapshot. New problems or labs reach
  the group only after another build and upload (or, on option 2, another push).
- **Phones**: the practice bank is built for them — full-screen problem sheet, 44px targets,
  16px inputs so Safari doesn't zoom on focus. The 3D labs render and respond to touch
  (one finger orbits, two zoom), but 390px of portrait is not much room for a Gaussian
  surface. Problems on a phone, labs on a laptop.
