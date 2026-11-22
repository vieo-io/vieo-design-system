import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from '../src/TextField'

function described(element: Element) {
	return (element.getAttribute('aria-describedby') ?? '')
		.split(' ')
		.map((id) => document.getElementById(id)?.textContent)
}

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

		input.value = 'http://desk'
		fireEvent.input(input)
		flush()
		expect(input.value).toBe('http://desk')
		expect(input.getAttribute('aria-invalid')).toBe('true')
		expect(onChange).not.toHaveBeenCalled()

		fireEvent.change(input)
		expect(onChange).toHaveBeenCalledWith('http://desk')
	})

	it('the hint and error are read with the field', () => {
		render(() => (
			<TextField
				label='Address'
				value='http://desk'
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

	it('a new value from the caller replaces the draft', () => {
		const [value, setValue] = createSignal('one')
		render(() => <TextField label='Name' value={value()} onChange={() => {}} />)
		const input = screen.getByRole('textbox') as HTMLInputElement
		input.value = 'typed'
		fireEvent.input(input)
		flush()
		setValue('two')
		flush()
		expect(input.value).toBe('two')
	})

	it('a multiline field is a textarea with the same name and descriptions', () => {
		render(() => (
			<TextField
				label='Notes'
				value='x'
				hint='Hint'
				error='Error'
				multiline
				onChange={() => {}}
			/>
		))
		const area = screen.getByRole('textbox', { name: 'Notes' })
		expect(area.tagName).toBe('TEXTAREA')
		expect(area.getAttribute('aria-invalid')).toBe('true')
		expect(described(area)).toEqual(['Hint', 'Error'])
	})

	it('a field with no hint or error has no description', () => {
		render(() => <TextField label='Name' value='x' onChange={() => {}} />)
		expect(screen.getByRole('textbox').hasAttribute('aria-describedby')).toBe(false)
	})
})
