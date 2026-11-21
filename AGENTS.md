# vieo-design-system

A pnpm workspace. `packages/tokens` is `@vieo-io/tokens`; `packages/ui` and `apps/gallery` arrive with the Solid
components.

## Commands

| What                          | Command                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Everything, before a hand-off | `pnpm check`: Biome, every build, every test                                  |
| One package's tests           | `pnpm --filter @vieo-io/tokens test`, which is Vitest and then `tsc --noEmit` |
| Build the token CSS           | `pnpm --filter @vieo-io/tokens build`, into `packages/tokens/dist/`           |
| Format                        | `pnpm format`                                                                 |

There's no end-to-end suite yet, so the smoke pack is `pnpm check`.

## Which tests cover what

| Area                                             | Files                                                           |
| ------------------------------------------------ | --------------------------------------------------------------- |
| The source: schema, references, order            | `packages/tokens/test/source.test.ts`                           |
| The CSS reproduces RLN's and Catch's tokens      | `packages/tokens/test/golden.test.ts`, against `test/fixtures/` |
| Block shapes, Classic and Paper, the touch floor | `packages/tokens/test/output.test.ts`                           |
| Contrast in every palette and theme              | `packages/tokens/test/palettes.test.ts`                         |

## Changing a token

Edit the JSON in `packages/tokens/src/`, never `dist/`. A design or palette file sets base tokens without a `$type`. A
token it defines for itself, such as Aurora's `shadow-tint`, has one. A golden test that fails after a change means RLN
or Catch would look different. When the change is meant, update the fixture from that app's new CSS in the same commit
as the app's adoption.

## Releasing

1. Move `CHANGELOG.md`'s Unreleased entries under `## <version> (<date>)`, and set the package's `version` to match.
2. Commit it as "Release @vieo-io/tokens <version>", and tag it `tokens-v<version>`.
3. `pnpm --filter @vieo-io/tokens publish --access public`, which builds first through `prepublishOnly`.
