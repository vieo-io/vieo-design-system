import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { Resizer } from '../src/Resizer'

describe('Resizer', () => {
	it('arrow keys step the width within its limits, and Home and End reach them', () => {
		const [width, setWidth] = createSignal(256)
		render(() => (
			<Resizer
				label='Resize the sidebar'
				value={width()}
				min={220}
				max={300}
				reset={256}
				onChange={setWidth}
			/>
		))
		const handle = screen.getByRole('separator', { name: 'Resize the sidebar' })
		const press = (key: string) => {
			fireEvent.keyDown(handle, { key })
			flush()
		}
		expect(handle.getAttribute('aria-valuenow')).toBe('256')
		expect(handle.getAttribute('aria-valuemin')).toBe('220')
		expect(handle.getAttribute('aria-valuemax')).toBe('300')

		press('ArrowRight')
		expect(width()).toBe(272)
		press('ArrowRight')
		press('ArrowRight')
		expect(width(), 'clamped at the maximum').toBe(300)
		expect(handle.getAttribute('aria-valuenow')).toBe('300')
		press('ArrowLeft')
		expect(width()).toBe(284)
		press('Home')
		expect(width()).toBe(220)
		press('ArrowLeft')
		expect(width(), 'clamped at the minimum').toBe(220)
		press('End')
		expect(width()).toBe(300)

		fireEvent.dblClick(handle)
		flush()
		expect(width(), 'double-click resets').toBe(256)
	})

	it('a drag follows the pointer within the limits, and stops when the button comes up', () => {
		const [width, setWidth] = createSignal(256)
		render(() => (
			<Resizer
				label='Width'
				value={width()}
				min={220}
				max={300}
				reset={256}
				onChange={setWidth}
			/>
		))
		const handle = screen.getByRole('separator')
		handle.setPointerCapture = () => {}
		fireEvent.pointerDown(handle, { button: 0, clientX: 100, pointerId: 1 })
		fireEvent.pointerMove(handle, { clientX: 120.4 })
		flush()
		expect(width(), 'whole pixels').toBe(276)
		fireEvent.pointerMove(handle, { clientX: 400 })
		flush()
		expect(width()).toBe(300)
		fireEvent.pointerUp(handle)
		fireEvent.pointerMove(handle, { clientX: 0 })
		flush()
		expect(width()).toBe(300)
	})

	it('a secondary button does not start a drag', () => {
		const onChange = vi.fn()
		render(() => (
			<Resizer
				label='Width'
				value={256}
				min={220}
				max={300}
				reset={256}
				onChange={onChange}
			/>
		))
		const handle = screen.getByRole('separator')
		handle.setPointerCapture = () => {}
		fireEvent.pointerDown(handle, { button: 2, clientX: 100 })
		fireEvent.pointerMove(handle, { clientX: 140 })
		expect(onChange).not.toHaveBeenCalled()
	})

	it('an arrow key moves by the step it is given', () => {
		const onChange = vi.fn()
		render(() => (
			<Resizer
				label='Width'
				value={256}
				min={220}
				max={300}
				reset={256}
				step={4}
				onChange={onChange}
			/>
		))
		fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowUp' })
		expect(onChange).toHaveBeenCalledWith(260)
	})
})
