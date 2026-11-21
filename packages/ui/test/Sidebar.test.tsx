import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dialog } from '../src/Dialog'
import { Sidebar } from '../src/Sidebar'
import { stubMedia } from './media'
import { settle } from './settle'

function renderDrawer() {
	const [open, setOpen] = createSignal(false)
	const [dialog, setDialog] = createSignal(false)
	render(() => (
		<>
			<button type='button' onClick={() => setOpen(true)}>
				Menu
			</button>
			<Sidebar
				label='Pages'
				width={256}
				collapsed={false}
				onWidthChange={() => {}}
				onCollapsedChange={() => {}}
				drawerOpen={open()}
				onDrawerOpenChange={setOpen}
			>
				<a href='#first'>First page</a>
				<button type='button' onClick={() => setDialog(true)}>
					Rename
				</button>
				<Dialog title='Rename the page' open={dialog()} onOpenChange={setDialog}>
					<button type='button'>Save</button>
				</Dialog>
			</Sidebar>
		</>
	))
	return { open }
}

describe('Sidebar', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('at a narrow width the drawer traps focus, and Escape closes a dialog over it before the drawer', async () => {
		stubMedia(true)
		const { open } = renderDrawer()
		const menu = screen.getByRole('button', { name: 'Menu' })
		menu.focus()
		fireEvent.click(menu)
		await settle()
		const drawer = screen.getByRole('dialog', { name: 'Pages' })
		const first = screen.getByRole('link', { name: 'First page' })
		const rename = screen.getByRole('button', { name: 'Rename' })
		expect(drawer.contains(document.activeElement)).toBe(true)
		rename.focus()
		fireEvent.keyDown(rename, { key: 'Tab' })
		expect(document.activeElement, 'tab wraps inside the drawer').toBe(first)

		rename.focus()
		fireEvent.click(rename)
		await settle()
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
		await settle()
		expect(screen.queryByRole('dialog', { name: 'Rename the page' })).toBeNull()
		expect(open(), 'the drawer stays open under the closed dialog').toBe(true)

		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
		await settle()
		expect(open()).toBe(false)
		expect(document.activeElement).toBe(menu)
	})

	it('collapsing reports the change and leaves storage to the app', async () => {
		stubMedia(false)
		const store = vi.spyOn(Storage.prototype, 'setItem')
		const onCollapsedChange = vi.fn()
		render(() => (
			<Sidebar
				label='Pages'
				width={256}
				collapsed={false}
				onWidthChange={() => {}}
				onCollapsedChange={onCollapsedChange}
				drawerOpen={false}
				onDrawerOpenChange={() => {}}
			>
				<a href='#first'>First page</a>
			</Sidebar>
		))
		await settle()
		expect(screen.getByRole('navigation', { name: 'Pages' })).toBeTruthy()
		fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
		expect(onCollapsedChange).toHaveBeenCalledWith(true)
		expect(store).not.toHaveBeenCalled()
	})
})
