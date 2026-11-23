# Changelog

What changed in Vieo's shared design packages. Each package has its own version, named in each release heading.

## @vieo-io/tokens 0.3.0 and @vieo-io/fonts 0.2.0 (2026-11-23)

### Changed

- `@vieo-io/tokens`: the Vieo design is set in Geist, with Geist Mono for code, and sets no OpenType features. An app needs `@vieo-io/fonts` 0.2.0 to draw it.
- `@vieo-io/fonts`: Geist and Geist Mono 1.900, from the `geist` npm package, replace Inter and JetBrains Mono.

## @vieo-io/tokens 0.1.1 (2026-11-23)

From the `tokens-0.1` branch, for apps not yet ready for 0.2.0's phone controls.

### Changed

- `@vieo-io/tokens`: 0.3.0's font change. The Vieo design is set in Geist and Geist Mono, and needs `@vieo-io/fonts` 0.2.0.

## @vieo-io/tokens 0.2.0 and @vieo-io/ui 0.2.0 (2026-11-22)

### Added

- `@vieo-io/tokens`: each palette's gradient, as `--glow-1`, `--glow-2`, `--glow-strength`, and `--wash`, with RLN's colours and Vieo Dev's strength, and `--muted-on-wash` for muted text over it.
- `@vieo-io/ui`: `AppShell` takes `gradient`, which draws the wash on one backdrop behind a transparent sidebar, toolbar, and page. It is off when the person asks for more contrast or uses forced colours.
- `@vieo-io/ui`: a Tree row can have a second line under its label, an end that stacks a time over an icon, and an unread state that sets the label and the time bold. A second line joins the row's name.

### Changed

- `@vieo-io/tokens`: on a phone, Vieo draws its controls at 36px, 32px small, as the mockup did. Each still takes a 44px touch, and rows stay 44px tall. A design may now set its own control heights for a coarse pointer, and nothing else there.
- `@vieo-io/ui`: on a phone, text fields, selects, and the app switcher are at least 44px tall in every design, and buttons in a toolbar or a sidebar row stand far enough apart for each to take its 44px touch.

## @vieo-io/tokens 0.1.0, @vieo-io/ui 0.1.0, and @vieo-io/fonts 0.1.0 (2026-11-22)

### Added

- `@vieo-io/ui`: an app frame. AppShell, a Sidebar that becomes a drawer on a phone with a handle to resize it, a Tree with arrow keys and type-ahead, and a Toolbar that is one tab stop.
- `@vieo-io/ui`: form controls and settings rows: TextField, Checkbox, Switch, Select, SegmentedControl, and SettingRow.
- `@vieo-io/ui`: toasts that pause while hovered or focused, an app switcher, an object card for something another app owns, and Badge, Kbd, and EmptyState.
- `@vieo-io/ui`: IconButton, whose label shows in a tooltip, or beside the icon until its toolbar narrows. Every button takes a 44px touch on a phone, whatever it draws.
- `@vieo-io/ui`: on a phone a dialog rises from the bottom edge as a sheet. Dialogs, popovers, and the palette sit on `--raised`, and a dialog's title is set at the interface size.
- `@vieo-io/fonts`: Inter and JetBrains Mono for the Vieo design, subset from the upstream releases with every OpenType feature kept.
- `@vieo-io/tokens`: the Vieo design, the Vieo app's own. The sidebar sits on a ground colour with the page, toolbar included, as an inset panel, controls are 32px, and the type is Inter at 14px. RLN and Catch offer it in their design pickers and look the same until someone picks it.
- `@vieo-io/tokens`: `--ground`, `--surface`, `--raised`, and `--scrim` for shells and what floats over them, `--font-prose` and `--line-prose` for reading text, per-face font features, `--hit-min`, `--sidebar-width`, and `--shell-inset` and `--shell-radius` for a page panel set in from the window.
- `@vieo-io/ui`: Button, Icon, Dialog, Popover, Tooltip, Menu, Tabs, Listbox, and CommandPalette in Solid 2.0, styled by the tokens.
- A gallery app showing every component in every design, palette, and theme, with a Playwright run that screenshots each one and checks it with axe.
- `@vieo-io/tokens`: colour, space, type, shape, and motion tokens, with six designs and thirteen palettes in light and dark, as CSS that any Vieo app can load.
- `@vieo-io/tokens`: success and warning colours readable on every palette, and a set of layers for stacking.
- `@vieo-io/tokens`: grey secondary text reads at 4.5:1 on every palette. In light Paper, Clay, and Violet it is darker than RLN and Catch had it.
