import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { Dialog } from '../src/Dialog'
import { settle } from './settle'

function renderNested() {
	const [outer, setOuter] = createSignal(false)
	const [inner, setInner] = createSignal(false)
	render(() => (
		<>
			<button type='button' onClick={() => setOuter(true)}>
				Open outer
			</button>
			<Dialog title='Outer' open={outer()} onOpenChange={setOuter}>
				<button type='button' onClick={() => setInner(true)}>
					Open inner
				</button>
				<Dialog title='Inner' open={inner()} onOpenChange={setInner}>
					<button type='button'>First</button>
					<button type='button'>Last</button>
				</Dialog>
			</Dialog>
		</>
	))
	const open = async (name: string) => {
		const button = screen.getByRole('button', { name })
		button.focus()
		fireEvent.click(button)
		await settle()
		return button
	}
	return { open }
}

const dialogs = () =>
	screen.queryAllByRole('dialog').map((dialog) => dialog.querySelector('h2')?.textContent)

describe('Dialog', () => {
	it('escape and an outside click close the top dialog only, and focus returns to its trigger', async () => {
		const { open } = renderNested()
		const outerTrigger = await open('Open outer')
		const innerTrigger = await open('Open inner')
		expect(dialogs()).toEqual(['Outer', 'Inner'])

		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
		await settle()
		expect(dialogs()).toEqual(['Outer'])
		expect(document.activeElement).toBe(innerTrigger)

		await open('Open inner')
		const backdrops = document.querySelectorAll('.vds-dialog-backdrop')
		fireEvent.pointerDown(backdrops[backdrops.length - 1] as Element)
		await settle()
		expect(dialogs()).toEqual(['Outer'])

		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
		await settle()
		expect(dialogs()).toEqual([])
		expect(document.activeElement).toBe(outerTrigger)
	})

	it('focus stays inside an open modal dialog on tab and shift tab', async () => {
		const { open } = renderNested()
		await open('Open outer')
		await open('Open inner')
		const first = screen.getByRole('button', { name: 'First' })
		const last = screen.getByRole('button', { name: 'Last' })
		expect(document.activeElement).toBe(first)
		last.focus()
		fireEvent.keyDown(last, { key: 'Tab' })
		expect(document.activeElement).toBe(first)
		fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
		expect(document.activeElement).toBe(last)
	})
})
