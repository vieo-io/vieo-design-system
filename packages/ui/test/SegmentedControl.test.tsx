import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from '../src/SegmentedControl'

const OPTIONS = [
	{ value: 'a', label: 'A', disabled: true },
	{ value: 'b', label: 'B' },
	{ value: 'c', label: 'C' },
]

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

	it('a click chooses an option, and Up moves back like Left', () => {
		const [value, setValue] = createSignal('b')
		render(() => (
			<SegmentedControl label='Theme' value={value()} onChange={setValue} options={OPTIONS} />
		))
		fireEvent.click(screen.getByRole('radio', { name: 'C' }))
		flush()
		expect(value()).toBe('c')
		fireEvent.keyDown(screen.getByRole('radio', { name: 'C' }), { key: 'ArrowUp' })
		flush()
		expect(value()).toBe('b')
	})

	it('a disabled value leaves the first enabled option as the tab stop', () => {
		render(() => (
			<SegmentedControl label='Theme' value='a' onChange={() => {}} options={OPTIONS} />
		))
		expect(screen.getByRole('radio', { name: 'B' }).getAttribute('tabindex')).toBe('0')
		expect(screen.getByRole('radio', { name: 'A' }).getAttribute('tabindex')).toBe('-1')
	})

	it('End on the last option reports no change', () => {
		const onChange = vi.fn()
		render(() => (
			<SegmentedControl label='Theme' value='c' onChange={onChange} options={OPTIONS} />
		))
		fireEvent.keyDown(screen.getByRole('radio', { name: 'C' }), { key: 'End' })
		expect(onChange).not.toHaveBeenCalled()
	})
})
