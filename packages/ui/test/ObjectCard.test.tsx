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
	href: 'https://tracker.example/LLT-12',
}

describe('ObjectCard', () => {
	it('a card with an unknown schema version shows as a plain link', () => {
		render(() => <ObjectCard card={{ ...CARD, version: 2 }} />)
		const link = screen.getByRole('link')
		expect(link.textContent).toBe('Speaker labels drift after an hour')
		expect(link.getAttribute('href')).toBe('https://tracker.example/LLT-12')
		expect(screen.queryByRole('article')).toBeNull()
		expect(document.body.textContent).not.toContain('Tracker issue')
	})

	it('open hands the card to the host instead of following the link', () => {
		const onOpen = vi.fn()
		render(() => <ObjectCard card={CARD} onOpen={onOpen} />)
		expect(
			screen.getByRole('article', { name: 'Speaker labels drift after an hour' }),
		).toBeTruthy()
		const followed = fireEvent.click(
			screen.getByRole('link', { name: 'Open Speaker labels drift after an hour' }),
		)
		expect(onOpen).toHaveBeenCalledWith(CARD)
		expect(followed, 'the link is cancelled').toBe(false)
	})

	it('without a host to hand it to, Open follows the link', () => {
		render(() => <ObjectCard card={CARD} />)
		const open = screen.getByRole('link', { name: 'Open Speaker labels drift after an hour' })
		expect(fireEvent.click(open), 'not cancelled').toBe(true)
	})

	it('a click with Ctrl or Cmd held follows the link, so it can open in a new tab', () => {
		const onOpen = vi.fn()
		render(() => <ObjectCard card={CARD} onOpen={onOpen} />)
		const open = screen.getByRole('link', { name: 'Open Speaker labels drift after an hour' })
		expect(fireEvent.click(open, { ctrlKey: true })).toBe(true)
		expect(fireEvent.click(open, { metaKey: true })).toBe(true)
		expect(onOpen).not.toHaveBeenCalled()
	})

	it('a card without a status or summary draws neither', () => {
		render(() => <ObjectCard card={{ ...CARD, status: undefined, summary: undefined }} />)
		expect(document.querySelector('.vds-object-card__status')).toBeNull()
		expect(document.querySelector('.vds-object-card__summary')).toBeNull()
	})
})
