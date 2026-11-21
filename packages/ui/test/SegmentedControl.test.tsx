import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { SegmentedControl } from '../src/SegmentedControl'

describe('SegmentedControl', () => {
	it('arrow keys select the next option and skip disabled ones', () => {
		const [value, setValue] = createSignal('system')
		render(() => (
			<SegmentedControl
				label='Theme'
				value={value()}
				onChange={setValue}
				options={[
					{ value: 'system', label: 'System' },
					{ value: 'light', label: 'Light', disabled: true },
					{ value: 'dark', label: 'Dark' },
				]}
			/>
		))
		const radio = (name: string) => screen.getByRole('radio', { name })
		const checked = () =>
			screen
				.getAllByRole('radio')
				.filter((option) => option.getAttribute('aria-checked') === 'true')
				.map((option) => option.textContent)
		expect(checked()).toEqual(['System'])
		expect(radio('System').getAttribute('tabindex')).toBe('0')

		radio('System').focus()
		fireEvent.keyDown(radio('System'), { key: 'ArrowRight' })
		flush()
		expect(checked()).toEqual(['Dark'])
		expect(document.activeElement).toBe(radio('Dark'))
		expect(radio('Dark').getAttribute('tabindex')).toBe('0')
		expect(radio('System').getAttribute('tabindex')).toBe('-1')

		fireEvent.keyDown(radio('Dark'), { key: 'ArrowLeft' })
		flush()
		expect(checked()).toEqual(['System'])

		fireEvent.keyDown(radio('System'), { key: 'End' })
		flush()
		expect(checked()).toEqual(['Dark'])
	})
})
