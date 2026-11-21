# vieo-design-system

A pnpm workspace. `packages/tokens` is `@vieo-io/tokens`; `packages/ui` and `apps/gallery` arrive with the Solid
components.

## Commands

| What                          | Command                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Everything, before a hand-off | `pnpm check`: Biome, every build, every test                                                                      |
| One package's tests           | `pnpm --filter @vieo-io/tokens test`, which is Vitest and then `tsc --noEmit`                                     |
| Build the token CSS           | `pnpm --filter @vieo-io/tokens build`, into `packages/tokens/dist/`                                               |
| Format                        | `pnpm format`                                                                                                     |
| The gallery, by hand          | `pnpm --filter @vieo-io/ui build`, then `pnpm --filter @vieo-io/gallery dev`, on port 4400                        |
| The gallery run               | `cd apps/gallery && farm run --cores 4 --mem-gb 8 -- npx playwright test`, screenshots into `apps/gallery/shots/` |

There's no end-to-end suite yet, so the smoke pack is `pnpm check`.

## Which tests cover what

| Area                                                | Files                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| The source: schema, references, order               | `packages/tokens/test/source.test.ts`                                                       |
| The CSS reproduces RLN's and Catch's tokens         | `packages/tokens/test/golden.test.ts`, against `test/fixtures/`                             |
| Block shapes, Classic and Paper, the touch floor    | `packages/tokens/test/output.test.ts`                                                       |
| Contrast in every palette and theme                 | `packages/tokens/test/palettes.test.ts`                                                     |
| List keys, typeahead, and `aria()`                  | `packages/ui/test/aria.test.ts`                                                             |
| Each component's keyboard and focus behaviour       | `packages/ui/test/<Component>.test.tsx`                                                     |
| Every component in every design and theme, with axe | `apps/gallery/e2e/gallery.spec.ts`. The smoke pack is `pnpm check`; this is the whole suite |

## Changing a token

Edit the JSON in `packages/tokens/src/`, never `dist/`. A design or palette file sets base tokens without a `$type`. A
token it defines for itself, such as Aurora's `shadow-tint`, has one. A golden test that fails after a change means RLN
or Catch would look different. When the change is meant, add the app's value and the new one to `CHANGED` in
`packages/tokens/test/golden.test.ts`, and leave the fixtures as copies of the apps.

## Releasing

1. Move `CHANGELOG.md`'s Unreleased entries under `## <version> (<date>)`, and set the package's `version` to match.
2. Commit it as "Release @vieo-io/tokens <version>", and tag it `tokens-v<version>`.
3. `pnpm --filter @vieo-io/tokens publish --access public`, which builds first through `prepublishOnly`.

## Writing components

Read `node_modules/solid-js/skills/solid-2.0/SKILL.md` in `packages/ui` before writing Solid. A test fails on any Solid
dev diagnostic, the `[CODE]` lines the dev build prints, and `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md`
explains each one. Fix the cause rather than silencing it. The focus primitives move focus two frames later, so a test
awaits `settle()` from `test/settle.ts` before checking focus.
