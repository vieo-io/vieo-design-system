import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { THEMES } from '../generator/cascade.ts'
import { contrast, READABLE_TEXT, SELECTION_ON_PAGE } from '../generator/contrast.ts'
import { resolveColours } from '../generator/render.ts'
import { loadSource } from '../generator/source.ts'

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
