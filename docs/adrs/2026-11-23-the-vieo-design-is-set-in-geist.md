---

status: accepted
date: 2026-11-23
---

# The Vieo design is set in Geist

## Context

The Vieo design shipped in Inter and JetBrains Mono, from Callum's pick on 2026-11-21. On 2026-11-23 he changed it:
"Change the font in the design system to Geist instead, as per the alternative option in the mockups. Release it for
the apps that use it." The mockup's alternative was Geist with Geist Mono, set with no OpenType features and at Inter's
sizes.

Most Linux desktops have Inter installed, cj-desk-pc included, so RLN and Catch drew their Vieo option in Inter without
importing `@vieo-io/fonts`. No machine here has Geist.

## Decision

The Vieo design names `Geist` and `'Geist Mono'`, and sets no font features. `@vieo-io/fonts` holds those two faces in
place of Inter and JetBrains Mono, built from the `geist` npm package, which has version 1.900 of both faces against
1.800 and 1.701 in Google Fonts' repository. Every app that offers the Vieo design imports `@vieo-io/fonts`, RLN and
Catch included. This supersedes the font choice in
[the fonts ship in their own package](2026-11-22-fonts-ship-in-their-own-package.md); the package itself stands.

RLN and Catch take the change as `@vieo-io/tokens` 0.1.1, from a branch off `tokens-v0.1.0`. 0.2.0 draws Vieo's
buttons at 36px on a phone, and neither app has the touch areas around its buttons that
[the Vieo direction](2026-11-21-the-vieo-direction-is-a-new-design.md) asks for before it takes 0.2.0.

## Consequences

- The Linear design still names Inter and still relies on an installed copy.
- An app on the Vieo design without `@vieo-io/fonts` falls back to the system face, so the import is part of offering
  the design.
- `@font-face` downloads a face only when a page uses it, so RLN and Catch on their own designs fetch nothing new.
- The 0.1 branch takes fixes only until RLN and Catch move to the current tokens.
