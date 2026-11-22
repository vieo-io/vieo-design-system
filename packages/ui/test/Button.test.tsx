import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import { Button } from '../src/Button'

describe('Button', () => {
	it('an icon draws before the label, and the label alone names the button', () => {
		render(() => <Button icon='plus'>New</Button>)
		const button = screen.getByRole('button', { name: 'New' })
		expect(button.firstElementChild?.tagName.toLowerCase()).toBe('svg')
		expect(button.textContent).toBe('New')
	})
})
