---

status: accepted
date: 2026-11-21
---

# Components are Solid 2.0, written on solid-primitives and floating-ui

## Context

Callum, 2026-11-21: "I'd also want to begin the design system with Solid 2.0". He chose that the component library is
Solid 2.0, "used first by the new Vieo app. React apps keep their own components until each one moves to Solid."
Solid 2.0 went stable on 2026-11-17. A headless library would save writing focus, keyboard, and overlay behaviour.

## Decision

`@vieo-io/ui` writes its own components on `@solid-primitives/*` and `@floating-ui/dom`, ships them as JSX source under
the `solid` export condition, and styles them with plain CSS that reads `@vieo-io/tokens`. The behaviour follows the
WAI-ARIA patterns that RLN's and Catch's Radix-based menus and overlays already follow.

## Consequences

- The library owns its accessibility. Each component gets keyboard and focus tests, and the gallery runs axe in every
  design and theme.
- Moving to a headless library later is possible component by component, since the styling and the props are ours.

## Considered options

- **Kobalte 2.0**, at alpha 5 on 2026-11-21. Its modal Dialog ignores Escape and outside clicks (issue 755, fix
  unmerged).
- **Ark UI and Corvu**: neither has published Solid 2 support.
- **terracotta 2.0.0** supports Solid 2 and has most of the set, but has one maintainer.
