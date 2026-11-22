import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import { SettingRow } from '../src/SettingRow'
import { Switch } from '../src/Switch'

describe('SettingRow', () => {
	it('names and describes the control it holds', () => {
		const onChange = vi.fn()
		render(() => (
			<SettingRow label='Serif for long text' hint='Notes and transcripts in a serif.'>
				{(ids) => <Switch checked={false} onChange={onChange} {...ids} />}
			</SettingRow>
		))
		const control = screen.getByRole('switch', { name: 'Serif for long text' })
		const hint = document.getElementById(control.getAttribute('aria-describedby') ?? '')
		expect(hint?.textContent).toBe('Notes and transcripts in a serif.')
		fireEvent.click(control)
		expect(onChange).toHaveBeenCalledWith(true)
	})

	it('a row with no hint leaves its control undescribed', () => {
		render(() => (
			<SettingRow label='Compact sidebar'>
				{(ids) => <Switch checked onChange={() => {}} {...ids} />}
			</SettingRow>
		))
		expect(screen.getByRole('switch').hasAttribute('aria-describedby')).toBe(false)
	})
})
