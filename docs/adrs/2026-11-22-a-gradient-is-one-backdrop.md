---

status: accepted
date: 2026-11-22
---

# A gradient is one backdrop behind transparent chrome

## Context

RLN and Vieo Dev both offer a gradient: two colours per palette, washed in from the window's corners. RLN paints a
wash on each region, the page, the sidebar, and the view bar, so each starts again at its own edge. Vieo Dev paints one,
fixed to the window, behind a sidebar, a toolbar, and a page that are transparent over it. Callum asked for the second
when he reviewed Vieo Dev's: "The gradient should be spread uniformly against background / sidebar / toolbar areas,
with floating elements above them where appropriate." Callum then asked for Vieo Dev's gradient to join the design
system.

Measured against every palette, the wash at its strongest point takes muted text below 4.5:1 in six of the thirteen
palettes in light, at Vieo Dev's strength and at RLN's.

## Decision

`@vieo-io/tokens` holds each palette's `--glow-1` and `--glow-2`, from RLN's, a `--glow-strength` of 15% in light and
18% in dark, from Vieo Dev's, and `--wash`, Vieo Dev's three radial gradients over them. `AppShell`'s `gradient` draws
`--wash` over `--ground` on one fixed backdrop. The sidebar, the toolbar, and the page go transparent, and what floats
keeps its own colour. Inside it, `--muted` is `--muted-on-wash`, three tenths of the way from muted to text, which the
tests hold at 4.5:1 where the wash is strongest, on the ground and in the drawer, in every design. Under
`prefers-contrast: more` or forced colours there is no backdrop.

## Consequences

- An app gets the gradient from one prop, and every palette has one without the app defining any colours.
- In the Vieo design the inset page panel is transparent too, so the wash shows across the window. Its border and
  corners stay.
- Muted text is a little darker in light, and lighter in dark, while the gradient is on.
- RLN defines its own glows under the same selectors and loads them later, so its values still win until it adopts
  these. Moving it to the backdrop is its own release.

## Considered options

- **A wash per region, as RLN has it.** Each region's gradient restarts at its edge, which reads as separate panels
  and is what Callum asked to move away from.
- **A weaker wash so muted text passes unchanged.** Ember's muted text is at 4.5:1 on the ground already, so only a
  wash of about 1% passes in light, which shows nothing.
