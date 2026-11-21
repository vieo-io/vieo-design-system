import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import { Button } from '../src/Button'
import { Toolbar } from '../src/Toolbar'
import { settle } from './settle'

describe('Toolbar', () => {
	it('arrow keys move between toolbar buttons and tab leaves the toolbar', async () => {
		render(() => (
			<>
				<Toolbar label='Page' title='Release notes' leading={<Button>Back</Button>}>
					<Button>Share</Button>
					<Button disabled>Locked</Button>
					<Button>More</Button>
				</Toolbar>
				<button type='button'>After</button>
			</>
		))
		await settle()
		const [back, share, more] = ['Back', 'Share', 'More'].map((name) =>
			screen.getByRole('button', { name }),
		)
		const stops = screen
			.getAllByRole('button')
			.filter((button) => button.tabIndex >= 0 && !button.hasAttribute('disabled'))
		expect(stops.map((button) => button.textContent)).toEqual(['Back', 'After'])

		back?.focus()
		fireEvent.keyDown(back as HTMLElement, { key: 'ArrowRight' })
		expect(document.activeElement).toBe(share)
		fireEvent.keyDown(share as HTMLElement, { key: 'ArrowRight' })
		expect(document.activeElement, 'skips the disabled button').toBe(more)
		fireEvent.keyDown(more as HTMLElement, { key: 'Home' })
		expect(document.activeElement).toBe(back)
		fireEvent.keyDown(back as HTMLElement, { key: 'End' })
		expect(document.activeElement).toBe(more)
		expect(more?.tabIndex, 'the last focused button is the tab stop').toBe(0)
		expect(back?.tabIndex).toBe(-1)
		expect(screen.getByRole('toolbar', { name: 'Page' })).toBeTruthy()
	})
})
