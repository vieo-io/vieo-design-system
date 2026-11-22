import { fireEvent, render, screen } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tooltip } from '../src/Tooltip'

function renderTooltip() {
	render(() => (
		<Tooltip content='Save the note'>{(trigger) => <button {...trigger}>Save</button>}</Tooltip>
	))
	return screen.getByRole('button', { name: 'Save' })
}

describe('Tooltip', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('a tooltip opens on keyboard focus as well as hover', () => {
		vi.useFakeTimers()
		const button = renderTooltip()
		fireEvent.focus(button)
		flush()
		const tooltip = screen.getByRole('tooltip')
		expect(tooltip.textContent).toBe('Save the note')
		expect(button.getAttribute('aria-describedby')).toBe(tooltip.id)

		fireEvent.blur(button)
		flush()
		expect(screen.queryByRole('tooltip')).toBeNull()

		fireEvent.pointerEnter(button)
		flush()
		expect(screen.queryByRole('tooltip')).toBeNull()
		vi.advanceTimersByTime(500)
		flush()
		expect(screen.getByRole('tooltip')).toBeTruthy()
	})

	it('escape hides it', () => {
		const button = renderTooltip()
		fireEvent.focus(button)
		flush()
		fireEvent.keyDown(button, { key: 'Escape' })
		flush()
		expect(screen.queryByRole('tooltip')).toBeNull()
	})

	it('a tooltip whose when() is false stays shut on hover', () => {
		vi.useFakeTimers()
		render(() => (
			<Tooltip content='Share' when={() => false}>
				{(trigger) => <button {...trigger}>Share</button>}
			</Tooltip>
		))
		fireEvent.pointerEnter(screen.getByRole('button', { name: 'Share' }))
		vi.advanceTimersByTime(2000)
		flush()
		expect(screen.queryByRole('tooltip')).toBeNull()
	})
})
