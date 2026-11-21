# @vieo-io/fonts

The Vieo design's fonts: Inter for the interface and JetBrains Mono for code, as Latin subsets of the upstream
releases with every OpenType feature kept. Fontsource's builds drop `cv11`, `zero`, and `case`, which the Vieo design
sets, so these come from Google Fonts' repository instead.

```css
@import "@vieo-io/fonts/fonts.css";
```

Load it before `@vieo-io/tokens`. The faces are named `Inter` and `JetBrains Mono`, the names the Vieo design's
`--font-family-ui` and `--font-family-mono` ask for, so they take the place of any copy installed on the machine.

Each family's licence is the OFL text beside `fonts.css`. `sources.json` records where each file came from and the
version it was built from.

## Rebuilding

With Python's `fontTools` and `brotli` installed:

```sh
python3 -I scripts/build.py --download <an empty folder>
python3 -I scripts/build.py --check
```

The first fetches each source and licence, subsets them, and rewrites `fonts/`, `fonts.css`, the licences, and the
versions in `sources.json`. The second is the package's test: every file `fonts.css` names exists, keeps the features
`sources.json` lists for it, and has its licence beside it.
