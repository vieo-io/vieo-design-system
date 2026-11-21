import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderDesignsCss, renderPalettesCss, renderTokensCss } from '../generator/render.ts'
import { loadSource } from '../generator/source.ts'
import { cascadeShape, declarations, inlineImports } from './cascade.ts'

/**
 * Values the package changed on purpose since the fixtures were copied, as the app's value and the package's.
 * The light muted text in Paper, Clay, and Violet was darkened to reach 4.5:1 on the page.
 */
const CHANGED: Record<string, Record<string, string>> = {
	'--muted': { '#8a8a84': '#70706b', '#8a8173': '#736c60', '#7a7398': '#71698f' },
}

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url))

/** Designs the package added after the apps, which no app has yet. */
const PACKAGE_OWN = /data-design='vieo'/

const SOURCE = loadSource(fileURLToPath(new URL('../src', import.meta.url)))

const GENERATED = [
	renderTokensCss(SOURCE),
	renderDesignsCss(SOURCE),
	renderPalettesCss(SOURCE),
].join('\n')

const APPS = {
	rln: {
		css: () =>
			['rln/base.css', 'rln/designs.css', 'rln/palettes.css']
				.map((file) => inlineImports(FIXTURES + file))
				.join('\n'),
		/** RLN's own decoration and editor settings, which stay in RLN. */
		own: /^--(glow-|kind-|editor-|measure-comfortable$)/,
		ownSelectors: /data-(text-size|line-width|gradients)/,
	},
	catch: {
		css: () =>
			['catch/tokens.css', 'catch/designs.css', 'catch/palettes.css']
				.map((file) => inlineImports(FIXTURES + file))
				.join('\n'),
		own: /^$/,
		/** Moss is Catch's own palette. */
		ownSelectors: /data-palette='moss'/,
	},
} as const

describe.each(Object.entries(APPS))('the generated css against %s', (_app, app) => {
	const appDeclarations = declarations(app.css(), (property) => !app.own.test(property))
	for (const [property, list] of appDeclarations)
		list.splice(
			0,
			list.length,
			...list
				.filter((entry) => !app.ownSelectors.test(entry.selector))
				.map((entry) => ({
					...entry,
					value: CHANGED[property]?.[entry.value] ?? entry.value,
				})),
		)
	const generated = declarations(GENERATED, (property) => appDeclarations.has(property))
	for (const list of generated.values())
		list.splice(0, list.length, ...list.filter((entry) => !PACKAGE_OWN.test(entry.selector)))

	// The comparison sorts entries within one kind of block, which is sound only while no property is
	// declared twice under the same selector and media query.
	it.each([
		['the app', appDeclarations],
		['the generated css', generated],
	])('%s declares each property at most once per selector and media query', (_name, sheet) => {
		const repeats = [...sheet].flatMap(([property, list]) => {
			const places = list.map(({ media, selector }) => `${media} ${selector}`)
			return places
				.filter((place, index) => places.indexOf(place) !== index)
				.map((place) => `${property} ${place}`)
		})
		expect(repeats).toEqual([])
	})

	it('declares every token the app declares', () => {
		const missing = [...appDeclarations.keys()].filter((property) => !generated.has(property))
		expect(missing).toEqual([])
	})

	it.each([...appDeclarations.keys()])(
		'%s has the same values under the same selectors, in an order the cascade treats alike',
		(property) => {
			expect(cascadeShape(generated.get(property) ?? [])).toEqual(
				cascadeShape(appDeclarations.get(property) ?? []),
			)
		},
	)
})
