import { describe, expect, it } from 'vitest'
import { aria } from '../src/aria'
import { moveFor, typeahead } from '../src/roving'

describe('aria', () => {
	it('a boolean aria value renders as the string true or false', () => {
		expect([aria(true), aria(false), aria(undefined)]).toEqual(['true', 'false', undefined])
	})
})

describe('roving', () => {
	const items = [{ label: 'Alpha' }, { label: 'Beta', disabled: true }, { label: 'Bravo' }]

	it.each([
		['ArrowDown from the first skips the disabled one', 'ArrowDown', 0, 2],
		['ArrowDown stops at the end', 'ArrowDown', 2, 2],
		['ArrowUp skips back over the disabled one', 'ArrowUp', 2, 0],
		['ArrowUp stops at the start', 'ArrowUp', 0, 0],
		['End goes to the last enabled', 'End', 0, 2],
		['Home goes to the first enabled', 'Home', 2, 0],
		['ArrowDown with nothing focused goes to the first', 'ArrowDown', -1, 0],
		['a letter is not a move', 'a', 0, undefined],
	])('%s', (_, key, from, expected) => {
		expect(moveFor(key, items, from)).toBe(expected)
	})

	it('an empty list has nowhere to go', () => {
		expect([moveFor('Home', [], -1), moveFor('ArrowDown', [], -1)]).toEqual([-1, -1])
	})

	it('typeahead finds the next enabled item by its first letter and wraps', () => {
		expect([
			typeahead(items, 0, 'b'),
			typeahead(items, 2, 'a'),
			typeahead(items, 0, 'z'),
		]).toEqual([2, 0, -1])
	})
})
