import { fireEvent, render, screen } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster, toast } from '../src/Toast'

const shown = () => [...document.querySelectorAll('.vds-toast__message')].map((m) => m.textContent)

function renderToaster() {
	render(() => (
		<>
			<button type='button'>Save</button>
			<Toaster />
		</>
	))
	return screen.getByRole('button', { name: 'Save' })
}

describe('Toast', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('a toast is announced politely and never takes focus', () => {
		const save = renderToaster()
		save.focus()
		toast('Font changed to Inter', { kind: 'success' })
		flush()
		const region = screen.getByRole('region', { name: 'Notifications' })
		expect(region.getAttribute('aria-live')).toBe('polite')
		expect(region.textContent).toContain('Font changed to Inter')
		expect(document.activeElement).toBe(save)
	})

	it('a pinned toast with the same key replaces the last one and stays until acted on', () => {
		renderToaster()
		const onAction = vi.fn()
		toast('Update ready', { key: 'update', pinned: true })
		toast('Update ready to install', {
			key: 'update',
			pinned: true,
			action: { label: 'Restart', onAction },
		})
		flush()
		expect(shown()).toEqual(['Update ready to install'])

		vi.advanceTimersByTime(60_000)
		flush()
		expect(shown()).toEqual(['Update ready to install'])

		fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
		vi.advanceTimersByTime(1000)
		flush()
		expect(onAction).toHaveBeenCalledTimes(1)
		expect(shown()).toEqual([])
	})

	it('hovering or focusing a toast pauses its timer', () => {
		renderToaster()
		toast('Copied', { duration: 1000 })
		toast('Moved', { duration: 1000 })
		flush()
		const [copied, moved] = [...document.querySelectorAll('.vds-toast')] as HTMLElement[]
		fireEvent.pointerEnter(copied as HTMLElement)
		fireEvent.focusIn(moved as HTMLElement)
		vi.advanceTimersByTime(3000)
		flush()
		expect(shown()).toEqual(['Copied', 'Moved'])

		fireEvent.pointerLeave(copied as HTMLElement)
		vi.advanceTimersByTime(1500)
		flush()
		expect(shown()).toEqual(['Moved'])
	})

	it('a toast stays while focus is inside it, even after the pointer leaves', () => {
		renderToaster()
		toast('Copied', { duration: 1000, action: { label: 'Undo', onAction: () => {} } })
		flush()
		const item = document.querySelector('.vds-toast') as HTMLElement
		fireEvent.pointerEnter(item)
		fireEvent.focusIn(screen.getByRole('button', { name: 'Undo' }))
		fireEvent.pointerLeave(item)
		vi.advanceTimersByTime(3000)
		flush()
		expect(shown()).toEqual(['Copied'])
	})

	it('a toast lasts 4 seconds, or 8 with an action', () => {
		renderToaster()
		toast('Plain')
		toast('Action', { action: { label: 'Undo', onAction: () => {} } })
		flush()
		vi.advanceTimersByTime(3900)
		flush()
		expect(shown()).toEqual(['Plain', 'Action'])
		vi.advanceTimersByTime(400)
		flush()
		expect(shown()).toEqual(['Action'])
		vi.advanceTimersByTime(3500)
		flush()
		expect(shown()).toEqual(['Action'])
		vi.advanceTimersByTime(500)
		flush()
		expect(shown()).toEqual([])
	})

	it('Dismiss removes a pinned toast', () => {
		renderToaster()
		toast('Pinned', { pinned: true })
		flush()
		fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
		vi.advanceTimersByTime(500)
		flush()
		expect(shown()).toEqual([])
	})

	it('a key replaces only the toast with the same key', () => {
		renderToaster()
		toast('Plain')
		toast('Other', { key: 'other' })
		toast('One', { key: 'look' })
		toast('Two', { key: 'look' })
		flush()
		expect(shown()).toEqual(['Plain', 'Other', 'Two'])
	})

	it('hovering a pinned toast and leaving starts no timer', () => {
		renderToaster()
		toast('Pinned', { pinned: true })
		flush()
		const item = document.querySelector('.vds-toast') as HTMLElement
		fireEvent.pointerEnter(item)
		fireEvent.pointerLeave(item)
		vi.advanceTimersByTime(60_000)
		flush()
		expect(shown()).toEqual(['Pinned'])
	})

	it('a paused toast resumes with the time it had left', () => {
		renderToaster()
		toast('Copied', { duration: 1000 })
		flush()
		const item = document.querySelector('.vds-toast') as HTMLElement
		vi.advanceTimersByTime(600)
		fireEvent.pointerEnter(item)
		vi.advanceTimersByTime(5000)
		fireEvent.pointerLeave(item)
		vi.advanceTimersByTime(700)
		flush()
		expect(shown()).toEqual([])
	})
})
