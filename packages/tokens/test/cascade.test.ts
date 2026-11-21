import { describe, expect, it } from 'vitest'
import { cascadeShape, declarations } from './cascade.ts'

const shape = (css: string) => cascadeShape(declarations(css).get('--x') ?? [])

describe('the cascade comparison', () => {
	it('tells a design base block after the named designs from one before them', () => {
		const before = ":root[data-design] { --x: 1 } :root[data-design='a'] { --x: 2 }"
		const after = ":root[data-design='a'] { --x: 2 } :root[data-design] { --x: 1 }"
		expect(shape(before)).not.toEqual(shape(after))
	})

	it('treats two named designs in either order alike, since only one can match', () => {
		const one = ":root[data-design='a'] { --x: 1 } :root[data-design='b'] { --x: 2 }"
		const other = ":root[data-design='b'] { --x: 2 } :root[data-design='a'] { --x: 1 }"
		expect(shape(one)).toEqual(shape(other))
	})

	it('tells a changed value apart', () => {
		expect(shape(':root { --x: 1 }')).not.toEqual(shape(':root { --x: 2 }'))
	})

	it('keeps the media query as part of where a value applies', () => {
		const media = '@media (pointer: coarse) { :root { --x: 1 } }'
		expect(shape(media)).not.toEqual(shape(':root { --x: 1 }'))
	})
})
