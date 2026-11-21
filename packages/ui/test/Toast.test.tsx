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
})
