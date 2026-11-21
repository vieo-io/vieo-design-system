import { fireEvent, render, screen } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { type Command, CommandPalette, grouped, matching } from '../src/CommandPalette'

const commands = (): Command[] => [
	{ id: 'new', label: 'New note', group: 'Notes', onSelect: vi.fn() },
	{ id: 'theme', label: 'Switch theme', group: 'View', keywords: ['dark'], onSelect: vi.fn() },
	{ id: 'open', label: 'Open note', group: 'Notes', onSelect: vi.fn() },
	{ id: 'off', label: 'Sync now', group: 'View', disabled: true, onSelect: vi.fn() },
]

function renderPalette(list = commands()) {
	render(() => <CommandPalette label='Commands' commands={list} />)
	return { input: screen.getByRole('combobox') as HTMLInputElement, list }
}

function type(input: HTMLInputElement, text: string) {
	input.value = text
	fireEvent.input(input)
	flush()
}

const active = (input: HTMLInputElement) =>
	document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent

describe('CommandPalette', () => {
	it('every word must appear in the label or keywords, ignoring case', () => {
		expect(matching(commands(), 'NOTE op').map((c) => c.id)).toEqual(['open'])
		expect(matching(commands(), 'dark').map((c) => c.id)).toEqual(['theme'])
		expect(matching(commands(), '  ').map((c) => c.id)).toEqual(['new', 'theme', 'open', 'off'])
	})

	it('groups keep the order they first appear in, and rows are numbered in display order', () => {
		expect(
			grouped(commands()).map((g) => [g.name, g.rows.map((r) => [r.command.id, r.index])]),
		).toEqual([
			[
				'Notes',
				[
					['new', 0],
					['open', 1],
				],
			],
			[
				'View',
				[
					['theme', 2],
					['off', 3],
				],
			],
		])
	})

	it('typed text survives the results and classes changing', () => {
		const { input } = renderPalette()
		type(input, 'zzz')
		expect(input.classList.contains('vds-palette__input--empty')).toBe(true)
		expect(input.value).toBe('zzz')
		type(input, 'note')
		expect(input.classList.contains('vds-palette__input--empty')).toBe(false)
		expect(input.value).toBe('note')
	})

	it('no results shows the empty state, and enter does nothing', () => {
		const { input, list } = renderPalette()
		type(input, 'nothing matches')
		expect(screen.getByRole('status').textContent).toBe('No matching commands')
		expect(input.hasAttribute('aria-activedescendant')).toBe(false)
		fireEvent.keyDown(input, { key: 'Enter' })
		fireEvent.keyDown(input, { key: 'ArrowDown' })
		flush()
		for (const command of list) expect(command.onSelect).not.toHaveBeenCalled()
	})

	it('arrow keys move the highlight in display order, skip disabled commands, and enter runs it', () => {
		const { input, list } = renderPalette()
		expect(active(input)).toBe('New note')
		const press = (key: string) => {
			fireEvent.keyDown(input, { key })
			flush()
			return active(input)
		}
		expect([press('ArrowDown'), press('ArrowDown'), press('ArrowDown')]).toEqual([
			'Open note',
			'Switch theme',
			'Switch theme',
		])
		press('Enter')
		expect(list[1]?.onSelect).toHaveBeenCalledTimes(1)
	})

	it('the highlight goes back to the first result when the results change', () => {
		const { input } = renderPalette()
		fireEvent.keyDown(input, { key: 'ArrowDown' })
		flush()
		type(input, 'note')
		expect(active(input)).toBe('New note')
	})
})
