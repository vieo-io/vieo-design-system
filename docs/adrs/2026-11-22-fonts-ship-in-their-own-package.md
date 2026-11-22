---

status: accepted
date: 2026-11-22
---

# The fonts ship in their own package

## Context

Callum picked Inter for the Vieo design: "Inset, 32/28 buttons, Inter, call it Vieo". Its look depends on OpenType
features (`cv11` and `ss02` in the interface, `zero` in code), and the Vieo apps run in Tauri windows that may have no
network and no copy of Inter installed. The mockup loaded upstream subsets from its own folder rather than a CDN.

## Decision

`@vieo-io/fonts` holds Inter and JetBrains Mono as WOFF2 files subset to Latin, with every OpenType feature kept, and
a `fonts.css` of their faces. `scripts/build.py` makes them from the upstream releases recorded in `sources.json`, and
its `--check` is the package's test: each face named in `fonts.css` exists under its family's name, keeps the features
the design asks for, and ships its OFL text. `@vieo-io/tokens` names the families and loads nothing.

## Consequences

- An app that wants the Vieo design's type imports `@vieo-io/fonts/fonts.css` before the tokens. RLN and Catch, on
  their own designs, import nothing new.
- The package's licence is `MPL-2.0 AND OFL-1.1`: the scripts under the repository's licence, the fonts under theirs.
- Updating a font means running `build.py --download` and reviewing the new version string in `sources.json`.
- There is no serif or italic yet. Literata for long text, which the mockup showed, waits for a design that uses it.

## Considered options

- **Load from Google Fonts or another CDN.** Nothing to build, but no fonts offline, a request to a third party on
  every start, and the CDN's own subsetting, which can drop the features the design depends on.
- **Put the fonts in `@vieo-io/tokens`.** One import, but every app on another design would download faces it never
  uses, and the tokens package would carry a second licence.
- **Rely on installed fonts.** Most machines lack Inter, so the design would fall back to the system face.
