import { fireEvent, render, screen } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { IconButton } from '../src/IconButton'

describe('IconButton', () => {
	it('an icon-only button has its name as a tooltip and an accessible name, and a labelled one keeps its label until there is no room', () => {
		render(() => (
			<>
				<IconButton icon='more-horizontal' label='More' />
				<IconButton icon='pin' label='Pin' showLabel />
			</>
		))
		const more = screen.getByRole('button', { name: 'More' })
		expect(more.textContent).toBe('')
		fireEvent.focus(more)
		flush()
		expect(screen.getByRole('tooltip').textContent).toBe('More')
		fireEvent.blur(more)
		flush()

		const pin = screen.getByRole('button', { name: 'Pin' })
		expect(pin.textContent).toBe('Pin')
		fireEvent.focus(pin)
		flush()
		expect(screen.queryByRole('tooltip'), 'no tooltip while the label shows').toBeNull()
		fireEvent.blur(pin)
		flush()

		// What the toolbar's container query sets on the label once the bar runs out of room.
		pin.querySelector<HTMLElement>('.vds-button__label')?.style.setProperty(
			'--vds-collapsed',
			'1',
		)
		fireEvent.focus(pin)
		flush()
		expect(screen.getByRole('tooltip').textContent).toBe('Pin')
		expect(screen.getByRole('button', { name: 'Pin' })).toBe(pin)
	})
})
