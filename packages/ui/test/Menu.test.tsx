import { fireEvent, render, screen } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { Menu, type MenuItem } from '../src/Menu'
import { settle } from './settle'

function renderMenu(items: MenuItem[]) {
	render(() => (
		<Menu
			label='Actions'
			items={items}
			trigger={(trigger) => <button {...trigger}>Actions</button>}
		/>
	))
	const trigger = screen.getByRole('button', { name: 'Actions' })
	trigger.focus()
	fireEvent.click(trigger)
	flush()
	return trigger
}

const item = (label: string, disabled?: boolean): MenuItem => ({
	label,
	disabled,
	onSelect: vi.fn(),
})

describe('Menu', () => {
	it('typing a letter moves to the next item starting with it, and Escape returns focus to the trigger', () => {
		const trigger = renderMenu([item('Copy'), item('Cut', true), item('Cancel'), item('Paste')])
		expect(document.activeElement?.textContent).toBe('Copy')
		const menu = screen.getByRole('menu')
		fireEvent.keyDown(menu, { key: 'c' })
		expect(document.activeElement?.textContent).toBe('Cancel')
		fireEvent.keyDown(menu, { key: 'c' })
		expect(document.activeElement?.textContent).toBe('Copy')
		fireEvent.keyDown(menu, { key: 'Escape' })
		flush()
		expect(screen.queryByRole('menu')).toBeNull()
		expect(document.activeElement).toBe(trigger)
		expect(trigger.getAttribute('aria-expanded')).toBe('false')
	})

	it('choosing an item runs it once, closes the menu, and returns focus to the trigger', async () => {
		const items = [item('Copy'), item('Paste')]
		const trigger = renderMenu(items)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Paste' }))
		await settle()
		expect(items[1]?.onSelect).toHaveBeenCalledTimes(1)
		expect(screen.queryByRole('menu')).toBeNull()
		expect(document.activeElement).toBe(trigger)
	})

	it('a disabled item does nothing when clicked', () => {
		const items = [item('Copy', true)]
		renderMenu(items)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Copy' }))
		flush()
		expect(items[0]?.onSelect).not.toHaveBeenCalled()
		expect(screen.getByRole('menu')).toBeTruthy()
	})

	it('a click outside closes the menu', () => {
		renderMenu([item('Copy')])
		fireEvent.pointerDown(document.body)
		flush()
		expect(screen.queryByRole('menu')).toBeNull()
	})
})
