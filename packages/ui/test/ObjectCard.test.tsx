import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import { ObjectCard, type ObjectCardData } from '../src/ObjectCard'

const CARD: ObjectCardData = {
	version: 1,
	type: 'Tracker issue',
	status: 'In progress',
	title: 'Speaker labels drift after an hour',
	summary: 'Seen on two transcripts from 12 November.',
	icon: 'tracker',
	colour: '#c8611c',
	href: 'https://cj-omv/tracker/LLT-12',
}

describe('ObjectCard', () => {
	it('a card with an unknown schema version shows as a plain link', () => {
		render(() => <ObjectCard card={{ ...CARD, version: 2 }} />)
		const link = screen.getByRole('link')
		expect(link.textContent).toBe('Speaker labels drift after an hour')
		expect(link.getAttribute('href')).toBe('https://cj-omv/tracker/LLT-12')
		expect(screen.queryByRole('article')).toBeNull()
		expect(document.body.textContent).not.toContain('Tracker issue')
	})

	it('open hands the card to the host instead of following the link', () => {
		const onOpen = vi.fn()
		render(() => <ObjectCard card={CARD} onOpen={onOpen} />)
		expect(
			screen.getByRole('article', { name: 'Speaker labels drift after an hour' }),
		).toBeTruthy()
		fireEvent.click(
			screen.getByRole('link', { name: 'Open Speaker labels drift after an hour' }),
		)
		expect(onOpen).toHaveBeenCalledWith(CARD)
	})
})
