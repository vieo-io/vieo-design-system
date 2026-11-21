import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, it } from 'vitest'
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
})
