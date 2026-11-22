import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
	renderDesignsCss,
	renderIndexJs,
	renderPalettesCss,
	renderTokensCss,
} from '../generator/render.ts'
import { loadSource } from '../generator/source.ts'

type Json = Record<string, unknown>

const SRC = fileURLToPath(new URL('../src', import.meta.url))

const SOURCE = loadSource(SRC)

/** A copy of the source with one file changed. */
function sourceWith(file: string, change: (json: Json) => void): string {
	const dir = mkdtempSync(join(tmpdir(), 'vieo-tokens-'))
	cpSync(SRC, dir, { recursive: true })
	const json = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Json
	change(json)
	writeFileSync(join(dir, file), JSON.stringify(json))
	return dir
}

function group(json: Json, ...path: string[]): Json {
	return path.reduce((node, key) => node[key] as Json, json)
}

function render(dir: string): string {
	const source = loadSource(dir)
	return [
		renderTokensCss(source),
		renderDesignsCss(source),
		renderPalettesCss(source),
		renderIndexJs(source),
	].join('\n')
}

describe('the source', () => {
	it('a design setting a token the base lacks is refused, naming the token', () => {
		const dir = sourceWith('designs/aurora.json', (json) => {
			group(json, 'default', 'radius')['radius-xxl'] = { $value: '30px' }
		})
		expect(() => loadSource(dir)).toThrow(
			'designs/aurora.json: default.radius.radius-xxl sets a token the base lacks',
		)
	})

	it('a design may define a token of its own by giving it a type', () => {
		const aurora = SOURCE.designs.find((design) => design.name === 'aurora')
		expect(aurora?.default.tokens.find((token) => token.name === 'shadow-tint')?.type).toBe(
			'color',
		)
	})

	it('a design redefining a base token with a type is refused', () => {
		const dir = sourceWith('designs/aurora.json', (json) => {
			group(json, 'default', 'radius')['radius-xs'] = { $type: 'dimension', $value: '8px' }
		})
		expect(() => loadSource(dir)).toThrow(
			'default.radius.radius-xs is already defined in group radius',
		)
	})

	it('a token set in the wrong group is refused, naming its group', () => {
		const dir = sourceWith('palettes/rose.json', (json) => {
			group(json, 'default').radius = { accent: { $value: '#ff0000' } }
		})
		expect(() => loadSource(dir)).toThrow(
			'palettes/rose.json: default.radius.accent is in group color in the base',
		)
	})

	it('a reference to a missing token is refused', () => {
		const dir = sourceWith('palettes/rose.json', (json) => {
			group(json, 'default', 'color').accent = { $value: '{color.nowhere}' }
		})
		expect(() => loadSource(dir)).toThrow(
			'palettes/rose.json: accent refers to {color.nowhere}, which no token defines',
		)
	})

	it('a reference cycle is refused', () => {
		const dir = sourceWith('themes/dark.json', (json) => {
			group(json, 'color').bg = { $value: '{color.panel}' }
		})
		expect(() => loadSource(dir)).toThrow(
			'reference cycle bg -> panel -> bg, in classic, paper, dark',
		)
	})

	it('a token without a type is refused by the schema', () => {
		const dir = sourceWith('base.json', (json) => {
			delete group(json, 'color', 'bg').$type
		})
		expect(() => loadSource(dir)).toThrow(
			"base.json: /color/bg must have required property '$type'",
		)
	})

	it('a design missing from order.json is refused', () => {
		const dir = sourceWith('order.json', (json) => {
			json.designs = (json.designs as string[]).filter((name) => name !== 'slate')
		})
		expect(() => loadSource(dir)).toThrow('designs/slate.json is missing from order.json')
	})

	it('the same source in a different key order builds the same bytes', () => {
		const reverse = (node: Json): Json =>
			Object.fromEntries(
				Object.entries(node)
					.reverse()
					.map(([key, value]) => [
						key,
						value && typeof value === 'object' && !key.startsWith('$')
							? reverse(value as Json)
							: value,
					]),
			)
		const dir = sourceWith('designs/aurora.json', (json) => {
			const reversed = reverse(json)
			for (const key of Object.keys(json)) delete json[key]
			Object.assign(json, reversed)
		})
		const palettes = sourceWith('palettes/rose.json', (json) => {
			Object.assign(json, reverse(json))
		})
		expect(render(dir)).toBe(render(SRC))
		expect(render(palettes)).toBe(render(SRC))
	})

	it('the exported designs and palettes are the source files, with Classic and Paper the absence of one', () => {
		const names = (folder: string) =>
			readdirSync(join(SRC, folder))
				.map((file) => basename(file, '.json'))
				.filter((name) => name !== 'base')
				.sort()
		expect(SOURCE.order.designs[0]).toBe('classic')
		expect(SOURCE.order.designs.filter((name) => name !== 'classic').sort()).toEqual(
			names('designs'),
		)
		expect(SOURCE.order.palettes.filter((name) => name !== 'paper').sort()).toEqual(
			names('palettes'),
		)
	})

	it('a cycle formed by a palette and the dark theme is refused', () => {
		const palette = sourceWith('palettes/rose.json', (json) => {
			group(json, 'default', 'color').panel = { $value: '{color.danger}' }
		})
		const dir = sourceWith('themes/dark.json', (json) => {
			group(json, 'color').danger = { $value: '{color.panel}' }
		})
		cpSync(join(palette, 'palettes/rose.json'), join(dir, 'palettes/rose.json'))
		expect(() => loadSource(dir)).toThrow(
			'reference cycle panel -> danger -> panel, in classic, rose, dark',
		)
	})

	it('a cycle formed by a design and the design base is refused', () => {
		const design = sourceWith('designs/aurora.json', (json) => {
			group(json, 'default').space = { 'space-3': { $value: '{size.control-px}' } }
		})
		const dir = sourceWith('designs/base.json', (json) => {
			group(json, 'default', 'size')['control-px'] = { $value: '{space.space-3}' }
		})
		cpSync(join(design, 'designs/aurora.json'), join(dir, 'designs/aurora.json'))
		expect(() => loadSource(dir)).toThrow(
			'reference cycle space-3 -> control-px -> space-3, in aurora, ember, light',
		)
	})

	it('a cycle that exists only in light on a coarse pointer is refused', () => {
		const dir = sourceWith('designs/base.json', (json) => {
			group(json, 'default', 'size')['control-px'] = { $value: '{size.row-height}' }
			json.dark = { size: { 'control-px': { $value: '16px' } } }
			group(json, 'coarse', 'size')['row-height'] = { $value: '{size.control-px}' }
		})
		expect(() => loadSource(dir)).toThrow('in linear, ember, light, coarse pointer')
	})

	it('a cycle in default that dark breaks is still refused', () => {
		const dir = sourceWith('palettes/rose.json', (json) => {
			group(json, 'default', 'color').bg = { $value: '{color.panel}' }
			group(json, 'default', 'color').panel = { $value: '{color.bg}' }
		})
		expect(() => loadSource(dir)).toThrow(
			'reference cycle bg -> panel -> bg, in classic, rose, light',
		)
	})

	it("a design's coarse mode setting anything but control heights is refused", () => {
		const dir = sourceWith('designs/aurora.json', (json) => {
			json.coarse = { size: { 'row-height': { $value: '36px' } } }
		})
		expect(() => loadSource(dir)).toThrow(
			'designs/aurora.json: a coarse mode sets only control-height and control-height-sm, not row-height',
		)
	})

	it('a coarse mode in a palette is refused', () => {
		const dir = sourceWith('palettes/rose.json', (json) => {
			json.coarse = { size: { 'control-height': { $value: '36px' } } }
		})
		expect(() => loadSource(dir)).toThrow(
			'palettes/rose.json: only a design may set a coarse mode',
		)
	})

	it('a design defining one name in two groups is refused', () => {
		const dir = sourceWith('designs/aurora.json', (json) => {
			group(json, 'default', 'motion').glow = { $type: 'duration', $value: '1s' }
			group(json, 'default', 'color').glow = { $type: 'color', $value: '#fff' }
		})
		expect(() => loadSource(dir)).toThrow('is already defined in group')
	})

	it('a design defining its own token outside the default mode is refused', () => {
		const dir = sourceWith('designs/aurora.json', (json) => {
			group(json, 'dark', 'shadow').glow = { $type: 'shadow', $value: 'none' }
		})
		expect(() => loadSource(dir)).toThrow(
			'designs/aurora.json: dark.shadow.glow defines a token outside the default mode',
		)
	})

	it('a design overrides its own token in dark without repeating the type', () => {
		const dir = sourceWith('designs/aurora.json', (json) => {
			group(json, 'dark').color = { 'shadow-tint': { $value: 'navy' } }
		})
		expect(renderDesignsCss(loadSource(dir))).toContain(
			"\t:root[data-design='aurora']:not([data-theme='light']) {\n\t\t--shadow-1: 0 1px 2px rgb(0 0 0 / 34%);",
		)
		expect(renderDesignsCss(loadSource(dir))).toMatch(
			/--shadow-pop: 0 24px 60px -12px rgb\(0 0 0 \/ 66%\);\n\t\t--shadow-tint: navy;/,
		)
	})

	it('an order entry with no file is refused, apart from Classic and Paper', () => {
		const dir = sourceWith('order.json', (json) => {
			json.designs = [...(json.designs as string[]), 'ghost']
		})
		expect(() => loadSource(dir)).toThrow(
			'order.json lists ghost, which has no designs/ghost.json',
		)
	})

	it('a reference under the wrong group is refused, naming the reference', () => {
		const dir = sourceWith('palettes/rose.json', (json) => {
			group(json, 'default', 'color').accent = { $value: '{radius.bg}' }
		})
		expect(() => loadSource(dir)).toThrow(
			'palettes/rose.json: accent refers to {radius.bg}, which no token defines',
		)
	})

	it('a name repeated across groups in the base is refused', () => {
		const dir = sourceWith('base.json', (json) => {
			group(json, 'radius').bg = { $type: 'dimension', $value: '1px' }
		})
		expect(() => loadSource(dir)).toThrow(
			'base.json: radius.bg repeats a name another group holds',
		)
	})

	it.each(['red; color: blue', 'a } b', '{color.bg'])(
		'a value that would break out of its declaration is refused: %s',
		(value) => {
			const dir = sourceWith('palettes/rose.json', (json) => {
				group(json, 'default', 'color').accent = { $value: value }
			})
			expect(() => loadSource(dir)).toThrow(
				'palettes/rose.json: /default/color/accent/$value must match pattern',
			)
		},
	)

	it('a design with an unknown mode is refused', () => {
		const dir = sourceWith('designs/aurora.json', (json) => {
			json.drak = json.dark
		})
		expect(() => loadSource(dir)).toThrow(
			'designs/aurora.json: / must NOT have additional properties',
		)
	})
})
