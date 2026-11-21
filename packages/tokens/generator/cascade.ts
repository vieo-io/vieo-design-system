import type { Layer, Source } from './source.ts'

/** One combination of the root attributes and the pointer, which picks the blocks that apply. */
export type Context = { design: string; palette: string; theme: Theme; coarse: boolean }

export type Theme = (typeof THEMES)[number]

export const THEMES = ['light', 'dark'] as const

/** Every context the generated CSS can be in, Classic and Paper included. */
export function contexts(source: Source): Context[] {
	return source.order.designs.flatMap((design) =>
		source.order.palettes.flatMap((palette) =>
			THEMES.flatMap((theme) =>
				[false, true].map((coarse) => ({ design, palette, theme, coarse })),
			),
		),
	)
}

export function describeContext({ design, palette, theme, coarse }: Context): string {
	return `${design}, ${palette}, ${theme}${coarse ? ', coarse pointer' : ''}`
}

/**
 * The layers that apply in a context, weakest first, as the cascade orders the blocks the generator
 * writes: by specificity, then by position, with tokens.css, designs.css, and palettes.css loaded in that
 * order.
 */
export function layersFor(source: Source, context: Context): Layer[] {
	const dark = context.theme === 'dark'
	const design = source.designs.find((look) => look.name === context.design)
	const palette = source.palettes.find((look) => look.name === context.palette)
	const designed = context.design !== 'classic'
	if (designed && !design) throw new Error(`No design named ${context.design}`)
	if (context.palette !== 'paper' && !palette)
		throw new Error(`No palette named ${context.palette}`)

	// [specificity, position, layer]: more attribute selectors win, and a later block wins a tie.
	const blocks: [number, number, Layer | undefined][] = [
		[1, 0, { tokens: source.base }],
		[2, 1, dark ? source.dark : undefined],
		[2, 2, designed ? source.designBase.default : undefined],
		[3, 3, designed && dark ? source.designBase.dark : undefined],
		[2, 4, design?.default],
		[3, 5, dark ? design?.dark : undefined],
		[2, 6, designed && context.coarse ? source.designBase.coarse : undefined],
		[2, 7, palette?.default],
		[3, 8, dark ? palette?.dark : undefined],
	]
	return blocks
		.filter((block): block is [number, number, Layer] => block[2] !== undefined)
		.sort((a, b) => a[0] - b[0] || a[1] - b[1])
		.map(([, , layer]) => layer)
}
