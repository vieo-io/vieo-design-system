import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import { Select } from '../src/Select'

const OPTIONS = [
	{ value: 'classic', label: 'Classic' },
	{ value: 'vieo', label: 'Vieo' },
]

describe('Select', () => {
	it('shows the chosen value on first render, and reports a new choice', () => {
		const onChange = vi.fn()
		render(() => (
			<Select aria-label='Design' value='vieo' onChange={onChange} options={OPTIONS} />
		))
		const select = screen.getByRole('combobox', { name: 'Design' }) as HTMLSelectElement
		expect(select.value).toBe('vieo')
		select.value = 'classic'
		fireEvent.change(select)
		expect(onChange).toHaveBeenCalledWith('classic')
	})
})
