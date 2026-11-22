---

status: accepted
date: 2026-11-21
---

# The Vieo direction is a new design, not a new base

## Context

Callum wanted changes to the design system, not only what RLN and Catch already had: shorter buttons, flat sidebar
rows, one shared font, and labels beside icons where an icon alone isn't clear. A mockup showed two directions, and
he picked one: "Inset, 32/28 buttons, Inter, call it Vieo". RLN and Catch load these tokens, and the golden tests hold
the package to their values.

## Decision

The direction is `src/designs/vieo.json`, a design like the other six, listed second after Classic. It sets its values
under `:root[data-design='vieo']` and changes no base value, design, or palette. The surface roles it needs,
`--ground`, `--surface`, `--raised`, and `--scrim`, join the base with values that keep every other design as it was,
along with `--font-prose`, `--line-prose`, the two font-feature tokens, `--hit-min`, `--sidebar-width`,
`--shell-inset`, and `--shell-radius`.

## Consequences

- RLN and Catch look the same until someone picks Vieo in their design picker, and the golden tests treat Vieo's
  selectors as the package's own.
- The Vieo app defaults to it. Making it the base for every app later means one release per app, with a screenshot
  review of each.
- On a coarse pointer Vieo draws controls at 36px, 32px small, inside a 44px touch area, as the mockup drew them.
  Callum chose this on 2026-11-22, and a design's coarse mode may now set its two control heights and nothing else.
  Fields, selects, and rows stay 44px tall, because they can't hold a larger touch area. An app that offers Vieo needs
  its own touch areas around its buttons before it takes `@vieo-io/tokens` 0.2.0.

## Considered options

- **Replace Classic's values.** One look everywhere at once, but every RLN and Catch screen would change in the same
  release, untested against their own CSS.
- **A token file per app.** Each app would drift from the others, which is what the package exists to stop.
