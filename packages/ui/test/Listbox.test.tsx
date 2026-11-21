import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { Listbox, type ListboxOption } from '../src/Listbox'

const OPTIONS: ListboxOption[] = [
	{ value: 'a', label: 'Alpha' },
	{ value: 'b', label: 'Beta', disabled: true },
	{ value: 'c', label: 'Charlie' },
	{ value: 'd', label: 'Delta' },
]

function renderListbox(options = OPTIONS) {
	const [value, setValue] = createSignal('a')
	render(() => <Listbox label='Letters' options={options} value={value()} onChange={setValue} />)
	return value
}

const focused = () => document.activeElement?.textContent

describe('Listbox', () => {
	it('arrow keys move the active option and focus after the flush', () => {
		renderListbox()
		const list = screen.getByRole('listbox')
		screen.getByRole('option', { name: 'Alpha' }).focus()
		const press = (key: string) => {
			fireEvent.keyDown(list, { key })
			flush()
			return focused()
		}
		expect([press('ArrowDown'), press('ArrowDown'), press('ArrowDown')]).toEqual([
			'Charlie',
			'Delta',
			'Delta',
		])
		expect([press('Home'), press('ArrowUp'), press('End')]).toEqual(['Alpha', 'Alpha', 'Delta'])
		expect(screen.getByRole('option', { name: 'Delta' }).getAttribute('tabindex')).toBe('0')
		expect(screen.getByRole('option', { name: 'Alpha' }).getAttribute('tabindex')).toBe('-1')
	})

	it('disabled options are skipped and an empty list ignores keys', () => {
		const value = renderListbox()
		const beta = screen.getByRole('option', { name: 'Beta' })
		fireEvent.click(beta)
		flush()
		expect(value()).toBe('a')
		expect(beta.getAttribute('aria-disabled')).toBe('true')
		cleanupAndRenderEmpty()
	})

	it('enter chooses the focused option and marks it selected', () => {
		const value = renderListbox()
		screen.getByRole('option', { name: 'Charlie' }).focus()
		fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' })
		flush()
		expect(value()).toBe('c')
		expect(screen.getByRole('option', { name: 'Charlie' }).getAttribute('aria-selected')).toBe(
			'true',
		)
	})
})

function cleanupAndRenderEmpty() {
	document.body.innerHTML = ''
	render(() => <Listbox label='Nothing' options={[]} onChange={() => {}} />)
	const list = screen.getByRole('listbox', { name: 'Nothing' })
	expect(() => {
		for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'])
			fireEvent.keyDown(list, { key })
		flush()
	}).not.toThrow()
}
