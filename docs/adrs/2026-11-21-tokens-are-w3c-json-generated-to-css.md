---

status: accepted
date: 2026-11-21
---

# Tokens are W3C-format JSON, generated to CSS that apps import

## Context

rapid-local-notes (RLN) and linux-live-transcribe (Catch) each hand-write the same tokens, designs, and palettes in
CSS, copied from one to the other. Callum chose, on 2026-11-21, "Tokens first, Solid for new (Recommended)": "framework-neutral tokens and plain
CSS that every app adopts now". Vieo also has QML apps (foldview, colour-clock's player), and the kb's
`todo/vieo-single-stack.md` notes that "Things like KDE might need their own versions of things". A CSS file is
readable only by a browser.

## Decision

- The source is JSON in the W3C Design Tokens format, in `packages/tokens/src/`: `base.json`, `themes/dark.json`, one
  file per design and per palette, and `order.json`. Each `$value` is the CSS it becomes, with `{group.token}`
  references, and a JSON Schema checks every file.
- A generator in this repository, about 400 lines, writes `tokens.css`, `designs.css`, `palettes.css`, and the lists in
  `index.js`, in RLN's selectors and cascade order: Classic and Paper as the absence of an attribute, dark written under
  both the media query and `data-theme`, and the touch floor last.
- RLN's token names are the vocabulary. Each app keeps its own component rules, including the ones inside its design
  files, and its own app-only tokens.
- Golden tests compare the generated CSS with RLN's and Catch's, property by property, so adoption changes no pixel.

## Consequences

- A QML or KDE output is one more renderer over the same source, when foldview or colour-clock joins.
- Figma variables and Tokens Studio can import the JSON if a design tool is ever used. Code stays the source, which is
  the opposite of firecrest's Figma-first setup.
- `$value` holds CSS strings, such as `clamp()` and `color-mix()`, rather than the format's structured dimension and
  colour objects. A tool expecting those needs a converter.

## Considered options

- **CSS as the source**, as both apps have it. Fine for the web alone, but no other output can read it, and tests have
  to parse it.
- **Style Dictionary.** Each of RLN's selector shapes would need a custom format, which is most of a generator anyway,
  plus its dependencies in every app's lockfile. The JSON stays in the W3C format, so moving to it later costs only the
  generator.
- **shadcn's names**, as Vieo Dev uses. `--muted` is a surface there and a text colour in RLN and Catch.
