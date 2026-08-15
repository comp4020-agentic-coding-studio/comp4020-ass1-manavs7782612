# COMP4020 prototype

This is your starter repo for a COMP4020 prototype: a static site written in
HTML/CSS/TypeScript that builds to plain HTML/CSS/JS and deploys to GitHub
Pages. The **deployed site is what gets marked** --- not this repo, and not "it
works on my machine". It's marked live in Chrome against the deployed URL at two
viewports --- 1920×1080 (desktop) and 390×844 (phone) --- and both count in
full, so make that artefact good at both and use the checks below to know
whether it is.

What you're building this week — the spec — is published on the course website,
and this repo's name tells you which deliverable it is. Run the course plugin's
**start** skill at the start of each week: it pulls the right spec from the
course API, carries your harness forward from last week, and helps you turn the
spec's checkable lines into tests of your own. Read the spec before you build,
and see `spec/README.md` for how the checks in this repo relate to it.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Before you push, run `pnpm check`. It runs most of what CI runs --- build,
  lint, and the spec --- so you catch those in seconds instead of waiting for
  the pipeline. The links check, the evidence check, the secrets scan, and the
  deploy itself only run in CI; run `pnpm dlx linkinator ./dist --silent`
  locally against a fresh `pnpm build` for the links check without waiting for
  CI.
- To see what the page actually looks like rather than what you assume it looks
  like, open it in a browser (the `agent-browser` CLI, documented on
  [the course site](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/backpressure/#agent-browser-the-rendered-page-as-ground-truth),
  works well for this). The rendered page is the truth; your mental model of it
  isn't.
- When a check fails, read its output before changing anything. Each check below
  names what it measures, and the failure message is the instruction: it tells
  you the file, the line, or the contract. Treat a red check as authoritative
  --- the page is wrong until the check is green, not until you decide it should
  be.
- Commit when the checks pass. Never commit a red state.

## The checks (your sensors)

CI runs these on every push once your repo is public. GitHub's checks UI shows
two jobs, `check` and `deploy` --- not one status per sensor below --- and
within `check` the steps run in sequence (`pnpm check` chains typecheck, build,
lint, and the spec with `&&`), so an early failure like a broken build stops the
later sensors from running for that push; fix it and push again to see the rest.
While the repo is private (all week, until you ship) the CI jobs stay skipped
--- `pnpm check` is the same roster on your machine, and it's the faster loop
anyway. They aren't hoops. Each is a different way of finding out something true
about the site that you can't reliably see by looking at it.

They also carry a mark at a crit: the sweep runs fifteen minutes after your
cutoff, and green checks there are worth half that week's shipped mark. Still
running counts as not green, so ship with time for CI to finish.

- **typecheck** --- `tsc --noEmit` runs first in `pnpm check`, so a type error
  stops the roster before the build even starts. The types are extra
  backpressure: a red here is the compiler telling you a claim in the code is
  false.
- **build** --- the site must build (`pnpm build`). A build failure means the
  deployed site is broken or stale, so nothing else matters until this is green.
- **deploy / online** --- the live GitHub Pages URL must load and return the
  page you expect. An asset that 404s on the deployed URL counts as broken even
  if it loads locally.
- **spec** --- `spec/invariants.test.ts` asserts what's true of any good
  website, whatever the week's brief asks; the tests you write for the week's
  own spec run alongside it (any `spec/*.test.ts`). A failure names the contract
  you haven't met yet.
- **lint** --- `stylelint` for CSS, `oxlint` for TypeScript. Flags code that's
  wrong, fragile, or non-idiomatic. Read the rule it names.
- **tests** --- any other tests you write, wherever you put them (co-located
  with your source is fine, not just `spec/`), must pass. Vitest picks up both
  this and the spec suite in one `vitest run`, the last step of `pnpm check`. A
  failing test is a claim about the site that's no longer true.
- **evidence** (`pnpm check:evidence`) --- checks your process evidence:
  `PROCESS.md`'s citations resolve to real commits, the current deliverable's
  exact reflection is in `reflections/` (worked out from this repo's name
  against the public course API), and your `CLAUDE.md` is present. Evidence
  gates the deploy --- `deploy` needs `check` to pass, so failing evidence
  blocks the deploy alongside everything else. See
  [Your process is part of the mark](#your-process-is-part-of-the-mark) below,
  and the course website's
  [assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
  for what counts as evidence.
- **links** --- internal links must resolve. A broken link is a dead end you
  didn't mean to ship.
- **secrets** --- the repo is scanned for committed credentials. Never put a
  key, token, or password in a tracked file. If one leaks, rotate it. A local
  pre-commit hook (`.githooks/pre-commit`, installed by `pnpm install`) also
  blocks any commit containing something shaped like an API key --- by the time
  CI sees a key it's already pushed, so the hook is the sensor that matters.

Nothing here measures **accessibility** or **performance** --- wiring those
sensors (`axe-core`, Lighthouse, or whatever you choose) is your work, and later
in the course the spec will ask you to show how you tested both. When you do,
read a green performance result honestly: it's a lab estimate from one run on a
CI machine, not proof the site is fast for real users.

## The stack is swappable

Out of the box this is plain HTML/CSS/TypeScript on Vite, and every `.html` file
in the repo is a page: add pages, link them, and the build picks them up with no
config. That's a default, not a rule (unless the week's spec says otherwise).
You can swap in Astro or any other static generator, because nothing in CI names
a tool --- the whole contract is:

- `pnpm build` emits the complete site into `dist/`
- the `package.json` scripts (`check`, `check:evidence`, `build`) keep working
- whatever lands in `dist/` still passes the invariants in `spec/`

Two things bite in a swap. The deployed site lives under a path
(`…github.io/<repo>/`), so configure your generator's base path --- this
template's Vite config uses relative asset URLs to sidestep that, but most
generators (Astro included) need `base` set explicitly, and getting it wrong
looks fine locally while every asset 404s on the live URL. And commit the
updated `pnpm-lock.yaml`: CI installs with `--frozen-lockfile`.

## Your process is part of the mark

The deployed page is only half of it. How you got there is marked too: your
commit history, your agent files, and the decisions visible across them. The
checks above can't see any of that, so a person reads it directly --- which
means building legibly is part of building well.

- **Commit as you go.** Small, frequent commits are the record of how the work
  came together, and that record is read, not just the final state. A trail that
  grew alongside the code is the strongest evidence of your process; a single
  dump the night before is the weakest.
- **Keep a process overview** (`PROCESS.md`). A short reading-guide, not an
  essay: what you built, the moments that mattered --- each pointing at a
  commit, a `CLAUDE.md` change, or a prompt and the commit it produced --- and
  where to look in the history. It points a marker at the evidence; it doesn't
  stand in for it, and claims the history doesn't back don't count. The
  `PROCESS.md` in this repo is a template showing the shape and the citation
  format (link text the commit hash or range, target the commit or compare URL);
  `pnpm check:evidence` verifies your citations resolve to real commits before
  you ship. Markers follow those citations and don't trawl the repo for evidence
  you didn't cite.
- **Write your reflection in `reflections/`** --- a short markdown file in this
  repo, named for the deliverable it answers, so the number in the filename is
  the number in this repo's name (`crit-1.md` in `comp4020-crit1-<you>`,
  `assignment-1.md` in `comp4020-ass1-<you>`); `reflections/README.md` has the
  full rule. `pnpm check:evidence` checks the exact current name against the
  course API, not merely the presence of any well-named file. It answers the two
  standing prompts: the breakthrough that moved the work forward, and what this
  work changed about the developer you want to be. It stays out of the deployed
  site. It's due at the cutoff, and if it isn't in the repo by then the week
  doesn't count as shipped, however good the prototype is.
- **This file is process evidence.** The harness you build to direct the agent,
  this `CLAUDE.md` and any `AGENTS.md`, is itself read as part of how you
  worked. Keep it honest and current (see below).

You don't need a name, a student number, or any identity file in the repo: we
know whose repo it is. Spend the effort on the work.

## This file is yours

This CLAUDE.md is a starting point, not a fixed rulebook. As you learn what your
prototype needs --- a convention to hold the agent to, a sensor that keeps
catching you out, a fact about the stack the agent keeps getting wrong --- write
it down here. Growing this file is the work of harness engineering, and the gap
between this boilerplate and your own version is part of what your prototype
says about the developer you're becoming.

---

# Skyline (Assignment 1)

An interactive walk along the world's tallest buildings. The visitor starts
beside an ordinary single-storey Canberra house and travels **sideways** along
one continuous ground line to twenty buildings, ending at the Burj Khalifa. The
ground never leaves the screen; instead the whole world zooms out to keep the
next building in frame, so the house shrinks from a home to a speck while you
watch. Every building on screen at any instant shares one scale --- it is a
comparison chart you walk through.

## The five rules

These are the rules I hold the agent to on this prototype. Each one is paired
with a sensor, because a rule a check can't see is a rule that quietly stops
being true. **If you find yourself about to break one, stop and say so instead
of working around it.**

### 1. Accuracy comes first

The whole point of this prototype is that the numbers are real. A plausible
number is worse than no number, because it looks the same as a true one.

- Every figure in `src/data/**` carries a `source` (URL) and a `retrieved`
  (ISO date). **No number enters the codebase without both.** Not one you
  remember, not one you inferred from a neighbouring number, not one you
  averaged.
- Cross-check every height against a second source before freezing it. Where
  sources disagree (Merdeka 118's completion year does), the `note` field says
  so --- do not silently pick one.
- A modelled or typical figure is labelled as typical **in the data** --- the
  single-storey house and the three-storey townhouse are typical ACT
  dwellings, not measured buildings, and each carries a `note` field saying so.
  The dataset tests below check the `note`/`kind` fields directly, but the
  same caveat is also surfaced live: `App.vue`'s `.stop-info` card (the
  on-screen "what building is this" caption, restored after user testing
  found the journey unusably anonymous without it) shows a "typical, not
  measured" badge and prints `note` verbatim whenever the focused stop has
  one --- so the caveat is never dataset-only.
- Heights are **architectural top** (the CTBUH measure) for every stop,
  applied uniformly --- never mix in height-to-tip or highest-occupied-floor
  for one building and not the others. `.stop-info` states the same height
  figure for every stop with no per-stop wording changes, so any future
  inconsistency here would show up on screen, not just in the data.
- If you cannot source it, do not ship it. Tell me it's unsourced.

*Sensor:* `spec/assignment-1.test.ts` fails any entry missing `source` or
`retrieved`, any `source` that isn't an https URL, and any height outside
plausible bounds for its floor count.

### 2. Usability comes first among the things that aren't accuracy

The marker uses this for a minute, tabs through it, and resizes it mid-use. It
has to survive being used wrongly.

- Every action is reachable by keyboard, in a sensible tab order, with visible
  focus. If you add a click handler, you have added a keyboard path too, or you
  haven't finished.
- Hit targets are at least 44 px. Nothing is conveyed by colour or motion
  alone.
- `prefers-reduced-motion: reduce` turns ambient motion off and makes travel an
  instant jump. It is not a lesser experience; check it looks deliberate.
- Never hijack scrolling. The journey rides a **native** scroll container, so
  wheel, trackpad, touch inertia, the scrollbar, arrow keys, Home/End and
  find-in-page all keep working without being reimplemented. One deliberate
  exception: vertical wheel input with no larger horizontal component and no
  `ctrlKey` is redirected into the journey's own horizontal travel, since the
  journey has no vertical axis to scroll natively. Trackpad/touch horizontal
  panning, the scrollbar, ctrl+wheel pinch-zoom, and keyboard travel are all
  left untouched.

*Sensor:* tests assert the skip link, an accessible name on every stop, and a
single `aria-live` region; `axe-core` runs in `pnpm check` and zero serious
violations is the bar.

### 3. Both viewports count in full

Marked at 1920×1080 and 390×844. "Works on my machine" means the 1920 one.

- Never claim a layout works until it has been *looked at* at both sizes.
  Screenshots, not reasoning about CSS.
- `<body>` never scrolls horizontally --- the journey's own scroll container
  does. Wide content scrolls inside its own box.
- Design mobile-first for the HUD and the stop rail; the desktop layout is the
  one with room to spare, not the other way round.
- The journey is the only thing on the page. No whitespace header or footer
  above or below it --- the journey fills the viewport edge-to-edge.

*Sensor:* `scripts/shots.ts` captures both viewports; a test fails any fixed
width that escapes 390 px.

### 4. Static site, stretched as far as it goes

There is no backend and there will not be one. That is a constraint on
*requests*, not on computation --- everything the page shows still has to be
worked out on the client, never fetched or pre-rendered per case.

- **No network at runtime. Ever.** No `fetch`, no `XMLHttpRequest`, no
  `WebSocket`, no external fonts, no CDN, no remote images, no analytics.
- The sky walks the five standard twilight bands (day, civil, nautical,
  astronomical, night) in *journey order* --- day at the house, night at the
  Burj Khalifa, four stops per band (`src/scene/journeyPhase.ts`) --- rather
  than each city's live local time, so a visitor sees every phase in one
  sitting instead of whatever the clock happens to show. `src/scene/sun.ts`'s
  real solar-position calculator (latitude/longitude/time, no lookup table) is
  unused by that default path but stays in the repo, tested and correct, in
  case a later version wants live local time back.
- Everything the page needs ships in the bundle. If a feature needs a request,
  it's the wrong feature; find the client-side version of it.

*Sensor:* a test greps the built `dist/` JS for `fetch(`, `XMLHttpRequest`,
`WebSocket` and any external origin, and fails on a hit.

### 5. Nothing left running

Under a fling, a resize, a tab switch, or ten minutes idle, this page does
exactly what it should and nothing else.

- **Exactly one** `requestAnimationFrame` loop. It starts on interaction, stops
  when the camera settles, and stops on `visibilitychange`. Idle CPU is ~0%.
- **No `setInterval`.** Anywhere.
- Every listener, observer and animation is registered through
  `registerCleanup()` in `src/lifecycle.ts`. If you call `addEventListener`
  directly, you have introduced a leak.
- Scroll and resize listeners are `passive` and coalesced into the rAF loop ---
  never do layout work in a scroll handler.
- Guard against unintended actions: no double-firing on a fast tap, no
  animation queue that outlives its element, no state written from two places.

*Sensor:* a test fails on `setInterval` in `src/` and on any `addEventListener`
outside the lifecycle helper.

## Stack facts, so you stop re-deriving them

- **Vue 3 SFCs on Vite with TypeScript**, matching the reported stack behind
  neal.fun (the reference for this genre). `base: "./"` in `vite.config.ts`
  already handles the GitHub Pages path --- don't add a `base` anywhere else.
- `typecheck` is **`vue-tsc --noEmit`**, not `tsc`: `tsc` cannot read `.vue`.
- **All CSS lives in `.css` files** under `src/styles/`, imported from
  components --- never in SFC `<style>` blocks. `stylelint "**/*.css"` only
  sees real CSS files, and a style block no sensor reads is a blind spot.
- `spec/invariants.test.ts` parses the built `dist/index.html` with jsdom
  and requires a `<nav>`, exactly one `<h1>`, and alt text on images. So
  `index.html` keeps a real `<h1>` plus the skip-link/nav/announcer
  markup --- the heading carries `class="visually-hidden"` (off-screen via
  the existing `.visually-hidden` utility, not `display:none`), so a
  sighted visitor sees only the journey while a screen reader or
  view-source still finds it. There's no separate no-JS stop list: the
  twenty-stop dataset (`src/data/buildings.ts`) is the accuracy record,
  checked directly by the dataset tests in `spec/assignment-1.test.ts`,
  not rendered as a fallback list.
- Buildings are **hand-illustrated SVG art**, one file per stop
  (`src/assets/buildings/{stop.id}.svg`), drawn to that building's real
  silhouette rather than a generic tapering shape --- crisp at every zoom.
  Not a photograph: no licensing question, and still zero runtime network
  requests, since every asset is bundled into the build via
  `import.meta.glob` (`App.vue`) rather than fetched.

## Working here

- The rendered page is the truth. Look at it before you tell me something
  works, at both viewports.
- Commit at every green state, small and often.
- When a check goes red, read the failure before changing anything, and fix the
  cause rather than the assertion. Editing a test so it passes is only correct
  when the contract genuinely changed --- say which one, and why.
