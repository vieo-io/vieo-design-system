# Changelog

What changed in Vieo's shared design packages. Each package has its own version, named in each release heading.

## Unreleased

### Added

- `@vieo-io/tokens`: the Vieo design, the Vieo app's own. The sidebar and header sit on a ground colour with the page as an inset panel, controls are 32px, and the type is Inter at 14px. RLN and Catch offer it in their design pickers and look the same until someone picks it.
- `@vieo-io/tokens`: `--ground`, `--surface`, `--raised`, and `--scrim` for shells and what floats over them, `--font-prose` and `--line-prose` for reading text, per-face font features, `--hit-min`, and `--sidebar-width`.
- `@vieo-io/ui`: Button, Icon, Dialog, Popover, Tooltip, Menu, Tabs, Listbox, and CommandPalette in Solid 2.0, styled by the tokens.
- A gallery app showing every component in every design, palette, and theme, with a Playwright run that screenshots each one and checks it with axe.
- `@vieo-io/tokens`: colour, space, type, shape, and motion tokens, with six designs and thirteen palettes in light and dark, as CSS that any Vieo app can load.
- `@vieo-io/tokens`: success and warning colours readable on every palette, and a set of layers for stacking.
- `@vieo-io/tokens`: grey secondary text reads at 4.5:1 on every palette. In light Paper, Clay, and Violet it is darker than RLN and Catch had it.
