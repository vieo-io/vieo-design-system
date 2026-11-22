# The Vieo design system

What a Vieo app looks like, as tokens. `design-review` reads this file when it fixes a page, so each section says what a
token is for and when to reach for it. The values themselves are in `packages/tokens/src/`, and the CSS an app loads is
generated from them.

## How an app uses it

```css
@import "@vieo-io/tokens/tokens.css";
@import "@vieo-io/tokens/designs.css";
@import "@vieo-io/tokens/palettes.css";
/* the app's own CSS after these */
```

Load the three files in that order, before any component CSS. The palettes override the base colours at equal
specificity, so they must come after `tokens.css`, and a component rule that reads a token must come after all three.

The root element carries three attributes, and each one's absence is a choice in its own right:

| Attribute      | Values                                                                                                            | Absent means                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `data-design`  | `vieo`, `linear`, `aurora`, `slate`, `contrast`, `editorial`                                                      | Classic, the base values        |
| `data-palette` | `ember`, `clay`, `tangerine`, `marigold`, `fern`, `lagoon`, `zinc`, `ink`, `lavender`, `violet`, `orchid`, `rose` | Paper, the base colours         |
| `data-theme`   | `light`, `dark`                                                                                                   | Follow the machine's preference |

`import { DESIGNS, PALETTES, PALETTE_COLOURS } from '@vieo-io/tokens'` gives the same lists in order, with Classic and
Paper in their places, and each palette's colours in each theme for drawing a swatch. An app's picker reads these
rather than keeping its own list. Labels and descriptions are the app's own.

A design sets everything but colour, and a palette sets colour and nothing else, so any palette goes with any design. A
design may point the surface roles, `--ground`, `--surface`, and `--raised`, at other palette colours, or mix two of
them, but never names a colour of its own.

## Colour

| Token             | For                                                                            |
| ----------------- | ------------------------------------------------------------------------------ |
| `--bg`            | The page                                                                       |
| `--bg-elev`       | A raised surface: the sidebar, a card, a popover                               |
| `--panel`         | A panel that sits on the page. The page colour unless a palette separates them |
| `--ground`        | Behind a shell's page panel, under the sidebar                                 |
| `--surface`       | The panel a page's content sits on                                             |
| `--raised`        | What floats over the page: a dialog, a popover, a sheet, a toast               |
| `--scrim`         | Behind a modal dialog or sheet                                                 |
| `--bg-hover`      | A row or control under the pointer                                             |
| `--border`        | Hairlines between things                                                       |
| `--border-strong` | A control's outline, and a line that has to read at a glance                   |
| `--text`          | Body text. At least 7:1 on `--bg` in every palette                             |
| `--muted`         | Secondary text: meta, placeholders, a disabled label. Text, never a surface    |
| `--accent`        | The one colour that means "this is the action" or "this is where you are"      |
| `--accent-soft`   | The fill behind the selected row. `--text` stays readable on it                |
| `--accent-ink`    | Text and icons on an `--accent` fill                                           |
| `--selection`     | Selected text                                                                  |
| `--danger`        | Destructive actions and errors                                                 |
| `--success`       | Something finished or is healthy                                               |
| `--warning`       | Something needs attention but nothing failed                                   |
| `--syntax-*`      | Markdown and code colours: `marker`, `code`, `keyword`, `string`, `number`     |

`--success`, `--warning`, and `--danger` are readable as text on `--bg` in every palette and theme, and the tests hold
them to it. For a tinted background, mix the role into the page rather than adding a token:
`color-mix(in srgb, var(--warning) 12%, var(--bg))`.

Use `--accent` sparingly. A page where every second element is accented has no accent.

## Space

`--space-1` to `--space-6` are the only gaps: 4, 8, 12, 16, 24, and 32px in Classic, and wider in every other design.
Padding, margins, and flex and grid gaps come from this scale. A gap that falls between two steps is a sign the layout
needs a different structure, not a seventh step. Settings sections stacked 20px apart on a phone were the slip that
made this a rule.

## Type

| Token                                        | For                                               |
| -------------------------------------------- | ------------------------------------------------- |
| `--font-family-ui`                           | The chrome                                        |
| `--font-family-display`                      | Titles. The UI face unless a design sets one      |
| `--font-family-prose`                        | Long reading text, such as a note or a transcript |
| `--font-family-mono`                         | Code                                              |
| `--font-ui`, `--font-sm`, `--font-xs`        | Body, secondary, and the smallest text            |
| `--font-title`                               | A page's title                                    |
| `--font-prose`, `--line-prose`               | Reading text's size and line height               |
| `--font-features-ui`, `--font-features-mono` | Each face's OpenType features                     |
| `--weight-strong`                            | A label, a tab, or the active row                 |
| `--line-ui`                                  | Line height for the chrome                        |
| `--tracking-ui`, `--tracking-title`          | Letter spacing                                    |

That's four sizes for the chrome, one for reading text, and two weights, and a page needs no more. Text at another size
or a third weight is type drift, which Callum ruled a tell on 2026-11-20. Labels stay in sentence case. A run of all-caps
labels is another tell.

Set `font-feature-settings` from `--font-features-ui` on the chrome and from `--font-features-mono` on code, never on the
page as a whole. Features belong to a face: Literata's `ss02` swaps its letters for symbols, so Inter's `ss02` inherited
into Literata turns a transcript into a row of shapes. Numbers in tables, timers, and timestamps take
`font-variant-numeric: tabular-nums`.

## Size and shape

- `--control-height`, `--control-height-sm`, and `--control-px` for buttons and fields.
- `--row-height`, `--row-gap`, `--row-indent`, and `--tree-indent` for lists and trees.
- `--icon-size` and `--icon-size-sm`.
- `--hit-min`, the least a control accepts a touch over, and `--sidebar-width`, a sidebar's width until the person
  drags it.
- `--shell-inset` and `--shell-radius`, how far a shell's page panel sits in from the window and how round its
  corners are. Both are 0 unless a design insets the page.
- `--radius-xs` to `--radius-lg`, and `--radius-pill`. Small things take the small radii. A design changes them all
  together.
- `--doc-width` and `--doc-pad-*` for a document page.
- `--shadow-1` for resting, `--shadow-2` for raised, and `--shadow-pop` for something floating over the page.
  `--focus-ring` is what a focused control shows.
- `--dur` and `--ease` for every transition.
- `--z-raised`, `--z-sticky`, `--z-overlay`, `--z-popover`, `--z-dialog`, and `--z-toast`, lowest to highest. A
  component takes the layer it belongs to rather than a number of its own.

On a coarse pointer, every control takes a touch over at least `--hit-min`, 44px, whatever it draws, and rows stay at
least 44px tall. Buttons, checkboxes, switches, and segmented options hold a touch area larger than themselves, so a
design may draw them shorter: its coarse mode may set `--control-height` and `--control-height-sm`, and nothing else.
Buttons drawn shorter stand far enough apart that their touch areas don't overlap. A text field, a select, and the app
switcher can't hold a larger area, so they draw at least 44px tall.

## The designs

| Design    | Character                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Classic   | The base values. Plain, with 36px controls and an 8px step                                                       |
| Vieo      | The Vieo app's own. The sidebar on a ground colour, the page an inset panel, 32px controls, and Inter            |
| Linear    | A surface ladder and hairlines with no resting shadow, Inter at 590                                              |
| Aurora    | Round, with shadows tinted by the accent, and sized to be pressed. The other designs start from its measurements |
| Slate     | Small radii and soft shadows, with an offset ring on focus                                                       |
| Contrast  | Heavier lines, flat fills, and an offset shadow in place of a blur                                               |
| Editorial | A wide page, with prose set in a serif                                                                           |

A design's tokens live here. The component rules that go with a design, such as whether the active row is a pill or a
bar in the margin, are each app's own.

### Vieo

The direction Callum picked from a mockup on 2026-11-21, in his words: "Inset, 32/28 buttons, Inter, call it Vieo". The
rules it follows come from his notes the same day:

- "small inline buttons could look like the style of the buttons in this screenshot", T3 Code's sign-in dialog: an icon
  and a word, with a hairline outline, or none for the quieter of a pair.
- Buttons were too tall. Controls are 32px, and 28px small, against 40px and 34px in the other designs.
- "Icon buttons/switches can stand alone with a tooltip, but where icon alone isn't clear enough we'd want to show text
  alongside the button icon where space allows". A button whose icon is clear shows only the icon, with its name in a
  tooltip and as its accessible name. One whose icon isn't keeps its label until its bar runs out of room.
- Sidebar rows are flat, with state shown as a fill: the open row takes `--accent-soft`, and hover `--bg-hover`.

The shell puts the sidebar on `--ground` and the page, toolbar included, on `--surface`: a panel set in by
`--shell-inset` with `--shell-radius` corners. On a phone the panel takes the whole window. In
light the ground is the raised colour and the panel the page colour. In dark they swap, so the panel reads as lifted
rather than as a hole. Dialogs and popovers sit on `--raised`, which in dark is a step lighter than the panel.

The type is Inter with its single-storey a (`cv11`) and the disambiguation set (`ss02`), and JetBrains Mono for code:
14px for the chrome, 13px secondary, 12px smallest, 24px titles, and 16px reading text at a line height of 1.6. Rows
are 30px.

On a coarse pointer its controls draw at 36px, 32px small, inside the 44px touch area every control has. Fields,
selects, and rows stay 44px tall.

## What to avoid

These patterns read as agent-made, from the measurements in agent-home's `context/design-tells.md`. A fix replaces
them with what the tokens above already give.

- **Type drift.** More sizes or weights than the type scale has.
- **All-caps labels and eyebrows.** A small capitalised line above a heading.
- **Middle-dot meta lines**, such as "CPU only · 19.5 GB free". Use a separate line, a table cell, or a comma.
- **Cream with terracotta.** Claude's own colours. No palette here uses them.
- **Decorative dots.** A dot beside a status is a decision an app makes. A dot for decoration isn't.
- **Gradients as decoration.** RLN's sidebar wash stays within the human control set, and nothing in the shared set
  adds one.
