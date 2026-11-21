# @vieo-io/tokens

Vieo's design tokens: colour, space, type, shape, and motion, with six designs and thirteen palettes in light and dark.

```css
@import "@vieo-io/tokens/tokens.css";
@import "@vieo-io/tokens/designs.css";
@import "@vieo-io/tokens/palettes.css";
```

```ts
import { DESIGNS, PALETTES, PALETTE_COLOURS } from '@vieo-io/tokens'
```

Set `data-design`, `data-palette`, and `data-theme` on the root element. Leaving `data-design` off gives Classic, and
leaving `data-palette` off gives Paper. The repository's `design-system.md` says what each token is for.

The source is W3C Design Tokens JSON in `src/`, shipped with the package, with its schema at
`@vieo-io/tokens/schema.json`. Each `$value` is written as the CSS it becomes, and `{group.token}` is a reference.
