import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dialog } from '../src/Dialog'
import { Menu } from '../src/Menu'
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

function renderSidebar(narrow: boolean) {
	stubMedia(narrow)
	const [open, setOpen] = createSignal(false)
	const [collapsed, setCollapsed] = createSignal(false)
	const [dialog, setDialog] = createSignal(false)
	render(() => (
		<>
			<Sidebar
				label='Pages'
				width={256}
				collapsed={collapsed()}
				onWidthChange={() => {}}
				onCollapsedChange={setCollapsed}
				drawerOpen={open()}
				onDrawerOpenChange={setOpen}
			>
				<input aria-label='Rename' />
				<Menu
					label='Page actions'
					items={[{ label: 'Archive', onSelect: () => {} }]}
					trigger={(trigger) => (
						<button type='button' {...trigger}>
							Page actions
						</button>
					)}
				/>
			</Sidebar>
			<Dialog title='Rename the page' open={dialog()} onOpenChange={setDialog}>
				<button type='button'>Save</button>
			</Dialog>
		</>
	))
	return { collapsed, open, setDialog, setOpen }
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

	it('below the breakpoint Mod-B opens the drawer instead of collapsing', async () => {
		const { collapsed, open } = renderSidebar(true)
		await settle()
		fireEvent.keyDown(document, { key: 'b', metaKey: true })
		flush()
		expect(open()).toBe(true)
		expect(collapsed()).toBe(false)
	})

	it.each([
		['Alt', { altKey: true }],
		['Shift', { shiftKey: true }],
	])('Mod-B with %s held does nothing', async (_name, modifier) => {
		const { collapsed } = renderSidebar(false)
		await settle()
		fireEvent.keyDown(document, { key: 'b', ctrlKey: true, ...modifier })
		flush()
		expect(collapsed()).toBe(false)
	})

	it('Mod-B inside a text field is left to the field', async () => {
		const { collapsed } = renderSidebar(false)
		await settle()
		const event = fireEvent.keyDown(screen.getByRole('textbox'), { key: 'b', ctrlKey: true })
		flush()
		expect(collapsed()).toBe(false)
		expect(event, 'not cancelled, so the field can make text bold').toBe(true)
	})

	it('collapsing removes the nav and its resize handle', async () => {
		renderSidebar(false)
		await settle()
		fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
		await settle()
		expect(screen.queryByRole('navigation', { name: 'Pages' })).toBeNull()
		expect(screen.queryByRole('separator')).toBeNull()
	})

	it('a press on the scrim closes the drawer', async () => {
		const { open, setOpen } = renderSidebar(true)
		setOpen(true)
		await settle()
		fireEvent.pointerDown(document.querySelector('.vds-drawer-scrim') as Element)
		flush()
		expect(open()).toBe(false)
	})

	it('Escape that closes a menu inside the drawer leaves the drawer open', async () => {
		const { open, setOpen } = renderSidebar(true)
		setOpen(true)
		await settle()
		const trigger = screen.getByRole('button', { name: 'Page actions' })
		trigger.focus()
		fireEvent.click(trigger)
		await settle()
		fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
		await settle()
		expect(screen.queryByRole('menu')).toBeNull()
		expect(open()).toBe(true)
	})

	it('Escape while a dialog is open over the drawer leaves the drawer open', async () => {
		const { open, setOpen, setDialog } = renderSidebar(true)
		setOpen(true)
		await settle()
		setDialog(true)
		await settle()
		fireEvent.keyDown(document.body, { key: 'Escape' })
		await settle()
		expect(open()).toBe(true)
	})
})
