import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import {
	renderDesignsCss,
	renderIndexDts,
	renderIndexJs,
	renderPalettesCss,
	renderTokensCss,
	resolveColours,
} from '../generator/render.ts'
import { loadSource } from '../generator/source.ts'

const SOURCE = loadSource(fileURLToPath(new URL('../src', import.meta.url)))

function rules(css: string): { where: string; body: string }[] {
	const found: { where: string; body: string }[] = []
	postcss.parse(css).walkRules((rule) => {
		const media =
			rule.parent?.type === 'atrule'
				? `@media ${(rule.parent as postcss.AtRule).params} `
				: ''
		found.push({ where: media + rule.selector, body: rule.nodes.map(String).join(';') })
	})
	return found
}

describe('the generated css', () => {
	it.each([
		['tokens.css', ':root', renderTokensCss] as const,
		...SOURCE.designs.map(
			(design) =>
				[
					`designs.css ${design.name}`,
					`:root[data-design='${design.name}']`,
					renderDesignsCss,
				] as const,
		),
		...SOURCE.palettes.map(
			(palette) =>
				[
					`palettes.css ${palette.name}`,
					`:root[data-palette='${palette.name}']`,
					renderPalettesCss,
				] as const,
		),
	])(
		'%s: dark values appear under the media query and under data-theme dark, identically',
		(_name, selector, render) => {
			const all = rules(render(SOURCE))
			const byMedia = all.find(
				({ where }) =>
					where ===
					`@media (prefers-color-scheme: dark) ${selector}:not([data-theme='light'])`,
			)
			const byChoice = all.find(({ where }) => where === `${selector}[data-theme='dark']`)
			expect(byMedia?.body ?? '').toBe(byChoice?.body ?? '')
		},
	)

	it("the touch floor comes after every design's own blocks, and Vieo's touch heights after the floor", () => {
		const all = rules(renderDesignsCss(SOURCE)).map(({ where }) => where)
		const floor = all.indexOf('@media (pointer: coarse) :root[data-design]')
		const lastDesign = all.findLastIndex(
			(where) => !where.startsWith('@media (pointer: coarse)'),
		)
		expect(floor).toBeGreaterThan(lastDesign)
		expect(all.slice(floor + 1)).toEqual(["@media (pointer: coarse) :root[data-design='vieo']"])
	})

	it('classic writes no data-design block, and paper no data-palette block', () => {
		expect(renderDesignsCss(SOURCE)).not.toContain("data-design='classic'")
		expect(renderPalettesCss(SOURCE)).not.toContain("data-palette='paper'")
	})

	it("lists each palette's colours with references followed", async () => {
		const { PALETTE_COLOURS } = await indexJs()
		expect(PALETTE_COLOURS.paper?.light?.panel).toBe('#ffffff')
		expect(PALETTE_COLOURS.paper?.dark?.panel).toBe('#191919')
		expect(PALETTE_COLOURS.lagoon?.dark?.accent).toBe('#3ed0c8')
	})

	it('lists the designs and palettes in order, Classic and Paper in their places', async () => {
		const { DESIGNS, PALETTES } = await indexJs()
		expect(DESIGNS).toEqual([
			'classic',
			'vieo',
			'linear',
			'aurora',
			'slate',
			'contrast',
			'editorial',
		])
		expect(PALETTES).toEqual([
			'ember',
			'clay',
			'tangerine',
			'marigold',
			'fern',
			'lagoon',
			'paper',
			'zinc',
			'ink',
			'lavender',
			'violet',
			'orchid',
			'rose',
		])
	})

	it("gives each palette exactly the base's colour group, not the syntax colours", async () => {
		const { PALETTE_COLOURS } = await indexJs()
		const colours = SOURCE.base
			.filter((token) => token.group === 'color')
			.map((token) => token.name)
		expect(Object.keys(PALETTE_COLOURS.rose?.dark ?? {})).toEqual(colours)
	})

	it('declares the same lists and colour names in index.d.ts as index.js holds', async () => {
		const { DESIGNS, PALETTES, PALETTE_COLOURS } = await indexJs()
		const dts = renderIndexDts(SOURCE)
		const tuple = (names: string[]) =>
			`readonly [${names.map((name) => `'${name}'`).join(', ')}]`
		expect(dts).toContain(`DESIGNS: ${tuple(DESIGNS)}`)
		expect(dts).toContain(`PALETTES: ${tuple(PALETTES)}`)
		const colours = Object.keys(PALETTE_COLOURS.paper?.light ?? {})
		expect(dts).toContain(`ColourName = ${colours.map((name) => `'${name}'`).join(' | ')}`)
	})
})

describe('resolving a palette', () => {
	it("a palette's default value wins over the dark theme in dark, where the palette sets no dark value", () => {
		const source = structuredClone(SOURCE)
		const rose = source.palettes.find((palette) => palette.name === 'rose')
		const danger = source.base.find((token) => token.name === 'danger')
		if (!rose || !danger) throw new Error('fixture')
		rose.default.tokens.push({ ...danger, value: '#aa0000' })
		expect(resolveColours(source, 'rose', 'dark').danger).toBe('#aa0000')
	})

	it('follows a reference two levels deep to its final value', () => {
		const source = structuredClone(SOURCE)
		const rose = source.palettes.find((palette) => palette.name === 'rose')
		const [panel, selection] = ['panel', 'selection'].map((name) =>
			source.base.find((token) => token.name === name),
		)
		if (!rose || !panel || !selection) throw new Error('fixture')
		rose.default.tokens.push({ ...selection, value: '{color.panel}' })
		expect(resolveColours(source, 'rose', 'light').selection).toBe(
			resolveColours(source, 'rose', 'light').bg,
		)
	})
})

async function indexJs(): Promise<{
	DESIGNS: string[]
	PALETTES: string[]
	PALETTE_COLOURS: Record<string, Record<string, Record<string, string>>>
}> {
	return import(
		`data:text/javascript;base64,${Buffer.from(renderIndexJs(SOURCE)).toString('base64')}`
	)
}
