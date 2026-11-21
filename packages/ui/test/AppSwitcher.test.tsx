import { fireEvent, render, screen } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { type App, AppSwitcher } from '../src/AppSwitcher'
import { settle } from './settle'

const APPS: App[] = [
	{ id: 'vieo', name: 'Vieo', icon: 'home', colour: '#4f5bd5' },
	{ id: 'base', name: 'Vieo Base', icon: 'document', colour: '#2f6fde' },
	{ id: 'catch', name: 'Vieo Catch', icon: 'mic', colour: '#1f8a6a' },
	{
		id: 'tracker',
		name: 'Vieo Tracker',
		icon: 'tracker',
		colour: '#c8611c',
		description: 'In Base for now',
	},
]

describe('AppSwitcher', () => {
	it('arrow keys move through the apps and Enter opens the chosen one', async () => {
		const onOpen = vi.fn()
		render(() => <AppSwitcher apps={APPS} current='base' onOpen={onOpen} />)
		const trigger = screen.getByRole('button', { name: 'Vieo Base' })
		trigger.focus()
		fireEvent.click(trigger)
		flush()
		const menu = screen.getByRole('menu', { name: 'Apps' })
		expect(document.activeElement?.textContent).toBe('Vieo')
		expect(
			screen.getByRole('menuitem', { name: 'Vieo Base' }).getAttribute('aria-current'),
		).toBe('true')

		fireEvent.keyDown(menu, { key: 'ArrowDown' })
		fireEvent.keyDown(menu, { key: 'ArrowDown' })
		expect(document.activeElement?.textContent).toBe('Vieo Catch')
		fireEvent.keyDown(menu, { key: 'Enter' })
		await settle()
		expect(onOpen).toHaveBeenCalledTimes(1)
		expect(onOpen).toHaveBeenCalledWith(APPS[2])
		expect(screen.queryByRole('menu')).toBeNull()
	})
})
