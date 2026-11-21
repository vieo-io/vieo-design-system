# vieo-design-system

How Vieo apps look, in one place. Vieo is a set of apps that each install and run alone, under
[vieo.io](https://vieo.io), and this repository holds what they share on screen.

| Package                              | What it is                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| [`@vieo-io/tokens`](packages/tokens) | The design tokens: colour, space, type, shape, and motion, with designs and palettes. One JSON source, generated to CSS |
| `@vieo-io/ui`                        | Components in Solid 2.0. Coming next                                                                                    |

[`design-system.md`](design-system.md) says what each token is for and how an app adopts them. The decisions behind the
layout are in [`docs/adrs/`](docs/adrs).

## Use the tokens

```sh
pnpm add @vieo-io/tokens
```

```css
@import "@vieo-io/tokens/tokens.css";
@import "@vieo-io/tokens/designs.css";
@import "@vieo-io/tokens/palettes.css";
```

Then set `data-design`, `data-palette`, and `data-theme` on the root element.

## Work on it

Node 22.12 or later and pnpm.

```sh
pnpm install
pnpm check
```

## Licence

MIT.
