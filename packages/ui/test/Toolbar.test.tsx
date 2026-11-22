import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { Button } from '../src/Button'
import { Toolbar } from '../src/Toolbar'
import { settle } from './settle'

describe('Toolbar', () => {
	it('arrow keys move between toolbar buttons, and the toolbar is one tab stop', async () => {
		render(() => (
			<>
				<Toolbar label='Page' title='Release notes' leading={<Button>Back</Button>}>
					<Button>Share</Button>
					<Button disabled>Locked</Button>
					<Button>More</Button>
				</Toolbar>
				<button type='button'>After</button>
			</>
		))
		await settle()
		const [back, share, more] = ['Back', 'Share', 'More'].map((name) =>
			screen.getByRole('button', { name }),
		)
		const stops = screen
			.getAllByRole('button')
			.filter((button) => button.tabIndex >= 0 && !button.hasAttribute('disabled'))
		expect(stops.map((button) => button.textContent)).toEqual(['Back', 'After'])

		back?.focus()
		fireEvent.keyDown(back as HTMLElement, { key: 'ArrowRight' })
		expect(document.activeElement).toBe(share)
		fireEvent.keyDown(share as HTMLElement, { key: 'ArrowRight' })
		expect(document.activeElement, 'skips the disabled button').toBe(more)
		fireEvent.keyDown(more as HTMLElement, { key: 'Home' })
		expect(document.activeElement).toBe(back)
		fireEvent.keyDown(back as HTMLElement, { key: 'End' })
		expect(document.activeElement).toBe(more)
		expect(more?.tabIndex, 'the last focused button is the tab stop').toBe(0)
		expect(back?.tabIndex).toBe(-1)
		expect(screen.getByRole('toolbar', { name: 'Page' })).toBeTruthy()
	})

	it('arrow keys inside a text field move its caret, not the focus', async () => {
		render(() => (
			<Toolbar label='Page'>
				<Button>One</Button>
				<input aria-label='Find' />
				<Button>Two</Button>
			</Toolbar>
		))
		await settle()
		const two = screen.getByRole('button', { name: 'Two' })
		two.focus()
		fireEvent.keyDown(two, { key: 'ArrowLeft' })
		const find = screen.getByRole('textbox', { name: 'Find' })
		expect(document.activeElement).toBe(find)
		const event = fireEvent.keyDown(find, { key: 'ArrowLeft' })
		expect(document.activeElement).toBe(find)
		expect(event, 'not cancelled').toBe(true)
	})

	it('disabling the tab stop moves it to the next control', async () => {
		const [locked, setLocked] = createSignal(false)
		render(() => (
			<Toolbar label='Page'>
				<Button disabled={locked()}>One</Button>
				<Button>Two</Button>
			</Toolbar>
		))
		await settle()
		expect(screen.getByRole('button', { name: 'One' }).tabIndex).toBe(0)
		setLocked(true)
		await settle()
		expect(screen.getByRole('button', { name: 'Two' }).tabIndex).toBe(0)
	})

	it('arrow keys skip a control marked aria-disabled', async () => {
		render(() => (
			<Toolbar label='Page'>
				<Button>One</Button>
				<Button aria-disabled='true'>Two</Button>
				<Button>Three</Button>
			</Toolbar>
		))
		await settle()
		const one = screen.getByRole('button', { name: 'One' })
		one.focus()
		fireEvent.keyDown(one, { key: 'ArrowRight' })
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Three' }))
	})
})
