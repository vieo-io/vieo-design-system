import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from '../src/TextField'

describe('TextField', () => {
	it('typed text survives an error message appearing', () => {
		const [error, setError] = createSignal<string>()
		const onChange = vi.fn()
		render(() => (
			<TextField
				label='Address'
				value=''
				error={error()}
				onInput={(text) => setError(text.startsWith('https://') ? undefined : 'Use https')}
				onChange={onChange}
			/>
		))
		const input = screen.getByRole('textbox', { name: 'Address' }) as HTMLInputElement
		expect(input.getAttribute('aria-invalid')).toBe('false')

		input.value = 'http://cj-desk'
		fireEvent.input(input)
		flush()
		expect(input.value).toBe('http://cj-desk')
		expect(input.getAttribute('aria-invalid')).toBe('true')
		expect(onChange).not.toHaveBeenCalled()

		fireEvent.change(input)
		expect(onChange).toHaveBeenCalledWith('http://cj-desk')
	})

	it('the hint and error are read with the field', () => {
		render(() => (
			<TextField
				label='Address'
				value='http://cj-desk'
				hint='It ends in a one-time code.'
				error='Use https'
				onChange={() => {}}
			/>
		))
		const input = screen.getByRole('textbox', { name: 'Address' })
		const ids = input.getAttribute('aria-describedby')?.split(' ') ?? []
		expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
			'It ends in a one-time code.',
			'Use https',
		])
	})
})
