import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import postcss from 'postcss'

/** One declaration of a custom property, where it sits in the cascade. */
export type Declaration = { media: string; selector: string; value: string }

/**
 * Every custom property's declarations in stylesheet order. A custom property's computed value depends
 * only on its own declarations, their selectors, and their order, so two stylesheets with equal maps
 * give every element the same tokens. It refuses `!important` and every at-rule but one level of
 * `@media`, which it can't compare.
 */
export function declarations(
	css: string,
	keep: (property: string) => boolean = () => true,
): Map<string, Declaration[]> {
	const found = new Map<string, Declaration[]>()
	postcss.parse(css).walkDecls((decl) => {
		if (!decl.prop.startsWith('--') || !keep(decl.prop)) return
		if (decl.important)
			throw new Error(`${decl.prop} is !important, which this comparison ignores`)
		const rule = decl.parent
		if (rule?.type !== 'rule') return
		const parent = rule.parent?.type === 'atrule' ? (rule.parent as postcss.AtRule) : undefined
		if (parent && (parent.name !== 'media' || parent.parent?.type === 'atrule'))
			throw new Error(`@${parent.name} is a rule this comparison ignores`)
		const media = parent?.params ?? ''
		const list = found.get(decl.prop) ?? []
		list.push({
			media,
			selector: squash((rule as postcss.Rule).selector),
			value: squash(decl.value),
		})
		found.set(decl.prop, list)
	})
	return found
}

/**
 * The shape of one property's cascade that ordering can affect. Blocks for two different designs, or two
 * palettes, never match together, so only the order between kinds of block is kept, with each kind's
 * entries sorted.
 */
export function cascadeShape(list: Declaration[]): { kinds: string[]; entries: string[] } {
	const kind = ({ media, selector }: Declaration) =>
		`${media} ${selector.replace(/='[a-z]+'/g, '=*')}`
	const kinds = list.map(kind).filter((value, index, all) => value !== all[index - 1])
	const entries = list
		.map(({ media, selector, value }) => `${media} ${selector} => ${value}`)
		.sort()
	return { kinds, entries }
}

/** A stylesheet's text with its `@import`s inlined, as a bundler serves it. */
export function inlineImports(file: string): string {
	return readFileSync(file, 'utf8').replace(/^@import '(.+)';$/gm, (_line, imported: string) =>
		inlineImports(join(dirname(file), imported)),
	)
}

function squash(text: string): string {
	return text.replace(/\s+/g, ' ').trim()
}
