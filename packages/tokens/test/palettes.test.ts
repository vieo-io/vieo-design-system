import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { layersFor, THEMES } from '../generator/cascade.ts'
import { contrast, READABLE_TEXT, SELECTION_ON_PAGE } from '../generator/contrast.ts'
import { renderPalettesCss, resolveColours } from '../generator/render.ts'
import { loadSource } from '../generator/source.ts'
import { cascadeShape, declarations } from './cascade.ts'

const SOURCE = loadSource(fileURLToPath(new URL('../src', import.meta.url)))

const ALL = SOURCE.order.palettes.map((name) => [name])

const themes = (name: string) =>
	THEMES.map((theme) => [theme, resolveColours(SOURCE, name, theme)] as const)

describe('every palette meets the contrast targets in both themes', () => {
	it.each(ALL)('%s draws a selection that stands out and keeps its text readable', (name) => {
		for (const [theme, colours] of themes(name)) {
			expect(
				contrast(colours.text ?? '', colours.selection ?? ''),
				`${theme} text on the selection`,
			).toBeGreaterThanOrEqual(READABLE_TEXT)
			expect(
				contrast(colours.selection ?? '', colours.bg ?? ''),
				`${theme} selection on the page`,
			).toBeGreaterThanOrEqual(SELECTION_ON_PAGE)
		}
	})

	it.each(ALL)("%s keeps the open page's sidebar row readable", (name) => {
		for (const [theme, colours] of themes(name)) {
			expect(
				contrast(colours.text ?? '', colours['accent-soft'] ?? ''),
				theme,
			).toBeGreaterThanOrEqual(READABLE_TEXT)
		}
	})

	it.each(ALL)('%s keeps text and buttons readable', (name) => {
		for (const [theme, colours] of themes(name)) {
			expect(
				contrast(colours.text ?? '', colours.bg ?? ''),
				`${theme} text`,
			).toBeGreaterThanOrEqual(7)
			expect(
				contrast(colours['accent-ink'] ?? '', colours.accent ?? ''),
				`${theme} button label`,
			).toBeGreaterThanOrEqual(4.5)
		}
	})

	it.each(ALL)('%s keeps muted text readable on the page and on raised surfaces', (name) => {
		for (const [theme, colours] of themes(name)) {
			for (const surface of ['bg', 'bg-elev']) {
				expect(
					contrast(colours.muted ?? '', colours[surface] ?? ''),
					`${theme} muted on ${surface}`,
				).toBeGreaterThanOrEqual(READABLE_TEXT)
			}
		}
	})

	it.each(ALL)('%s keeps success, warning, and danger readable as text on the page', (name) => {
		for (const [theme, colours] of themes(name)) {
			for (const role of ['success', 'warning', 'danger']) {
				expect(
					contrast(colours[role] ?? '', colours.bg ?? ''),
					`${theme} ${role}`,
				).toBeGreaterThanOrEqual(READABLE_TEXT)
			}
		}
	})
})

describe("every palette's gradient", () => {
	it.each(SOURCE.palettes.map((palette) => [palette.name, palette] as const))(
		'%s sets its two glows in light and in dark, and leaves the strength and the wash to the base',
		(_name, palette) => {
			for (const layer of [palette.default, palette.dark]) {
				const glows = layer.tokens.filter((token) => token.group === 'glow')
				expect(glows.map((token) => token.name)).toEqual(['glow-1', 'glow-2'])
			}
		},
	)

	// The wash's colour mixes with what is under it as an alpha does, so its strongest point is an sRGB mix of the two.
	it.each(ALL)(
		'%s keeps text and muted text readable where the wash is strongest, on the ground and in the drawer',
		(name) => {
			for (const design of SOURCE.order.designs)
				for (const theme of THEMES) {
					const values = new Map<string, string>()
					for (const layer of layersFor(SOURCE, {
						design,
						palette: name,
						theme,
						coarse: false,
					}))
						for (const token of layer.tokens) values.set(token.name, token.value)
					const strength = Number.parseFloat(values.get('glow-strength') ?? '')
					const colours = resolveColours(SOURCE, name, theme, design)
					const { 'muted-on-wash': muted = '', text = '' } = colours
					for (const [glow, share] of washShares(values.get('wash') ?? ''))
						for (const surface of ['ground', 'raised']) {
							const washed = mix(
								values.get(glow) ?? '',
								strength * share,
								colours[surface] ?? '',
							)
							const where = `${design} ${theme}, ${glow} at ${share} on ${surface}`
							expect(contrast(text, washed), `${where}: text`).toBeGreaterThanOrEqual(
								7,
							)
							expect(
								contrast(muted, washed),
								`${where}: muted`,
							).toBeGreaterThanOrEqual(READABLE_TEXT)
						}
				}
		},
	)

	it("the wash's strength is 15% in light and 18% in dark", () => {
		const strength = (tokens: { name: string; value: string }[]) =>
			tokens.find((token) => token.name === 'glow-strength')?.value
		expect([strength(SOURCE.base), strength(SOURCE.dark.tokens)]).toEqual(['15%', '18%'])
	})

	it("the contrast test reads all three of the wash's gradients", () => {
		const wash = SOURCE.base.find((token) => token.name === 'wash')?.value ?? ''
		expect(washShares(wash)).toEqual([
			['glow-1', 1],
			['glow-2', 0.8],
			['glow-1', 0.5],
		])
	})

	it("every palette's glows are RLN's", () => {
		const rln = readFileSync(new URL('./fixtures/rln/glows.css', import.meta.url), 'utf8')
		const glows = declarations(rln, (property) => property.startsWith('--glow-'))
		const generated = declarations(
			renderPalettesCss(SOURCE),
			(property) => property === '--glow-1' || property === '--glow-2',
		)
		for (const property of ['--glow-1', '--glow-2'])
			expect(cascadeShape(generated.get(property) ?? [])).toEqual(
				cascadeShape(glows.get(property) ?? []),
			)
	})
})

describe('every palette stays readable under the Vieo design', () => {
	const vieo = (name: string) =>
		THEMES.map((theme) => [theme, resolveColours(SOURCE, name, theme, 'vieo')] as const)

	it.each(ALL)('%s keeps text, muted text, and buttons readable on every surface', (name) => {
		for (const [theme, colours] of vieo(name)) {
			for (const surface of ['ground', 'surface', 'raised']) {
				expect(
					contrast(colours.text ?? '', colours[surface] ?? ''),
					`${theme} text on ${surface}`,
				).toBeGreaterThanOrEqual(7)
				expect(
					contrast(colours.muted ?? '', colours[surface] ?? ''),
					`${theme} muted on ${surface}`,
				).toBeGreaterThanOrEqual(READABLE_TEXT)
			}
			expect(
				contrast(colours['accent-ink'] ?? '', colours.accent ?? ''),
				`${theme} button label`,
			).toBeGreaterThanOrEqual(4.5)
		}
	})

	it('under Vieo, the dark ground, surface, and raised colours in Ember resolve to the design values', () => {
		const { ground, raised, surface } = resolveColours(SOURCE, 'ember', 'dark', 'vieo')
		expect([ground, surface, raised]).toEqual(['#1c1d20', '#242528', '#2c2d30'])
	})
})

/** Each glow the wash mixes in, with its share of `--glow-strength`, read from the wash's own value. */
function washShares(wash: string): [string, number][] {
	return [
		...wash.matchAll(
			/\{glow\.(glow-[12])\} (?:calc\(\{glow\.glow-strength\} \* ([\d.]+)\)|\{glow\.glow-strength\})/g,
		),
	].map(([, glow = '', share]) => [glow, share ? Number(share) : 1])
}

/** `#a` at `percent` over `#b`, as sRGB channels. */
function mix(a: string, percent: number, b: string): string {
	const channel = (hex: string, at: number) => Number.parseInt(hex.slice(at, at + 2), 16)
	return `#${[1, 3, 5]
		.map((at) =>
			Math.round((channel(a, at) * percent + channel(b, at) * (100 - percent)) / 100)
				.toString(16)
				.padStart(2, '0'),
		)
		.join('')}`
}
