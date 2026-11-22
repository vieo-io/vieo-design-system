import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from '../src/Checkbox'

describe('Checkbox', () => {
	it('is named by its label and reports the new state', () => {
		const onChange = vi.fn()
		render(() => <Checkbox label='Agree' checked={false} onChange={onChange} />)
		fireEvent.click(screen.getByRole('checkbox', { name: 'Agree' }))
		expect(onChange).toHaveBeenCalledWith(true)
	})
})
