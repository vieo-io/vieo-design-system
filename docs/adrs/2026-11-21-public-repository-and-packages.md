---

status: accepted
date: 2026-11-21
---

# The repository and its packages are public

## Context

vieo-core's [A repository per app](https://github.com/vieo-io/vieo-core/blob/main/docs/adrs/2026-11-16-a-repository-per-app.md)
puts each Vieo app in its own repository, so the design packages have to reach several repositories' installs. Callum,
2026-11-21: "make the repo public too".

## Decision

`vieo-io/vieo-design-system` is public on GitHub, and `@vieo-io/tokens` and `@vieo-io/ui` are public on npm, under the
Mozilla Public License 2.0. Callum, 2026-11-21, choosing it over MIT and GPLv3: "MPL-2.0 for the packages". It
keeps changes to the packages' own files open while letting each app choose its own licence, which GPLv3 would not.

## Consequences

- Any app, and any CI, installs the packages with no token.
- Nothing private goes in this repository: no app's unreleased screens, and no credentials in fixtures.

## Considered options

- **Private, installed from git.** Every app's CI would need a deploy key, and pnpm can't resolve a git dependency's
  workspace packages by version.
