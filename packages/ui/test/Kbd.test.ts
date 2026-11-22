import { describe, expect, it } from 'vitest'
import { shortcutLabel } from '../src/Kbd'

describe('shortcutLabel', () => {
	it.each([
		['apple', true, 'Mod+Shift+K', '⌘⇧K'],
		['elsewhere', false, 'Mod+Shift+K', 'Ctrl+Shift+K'],
		['elsewhere, a bare letter', false, 'k', 'K'],
		['elsewhere, a named key', false, 'Mod+Enter', 'Ctrl+Enter'],
		['apple, a named key', true, 'Mod+escape', '⌘Escape'],
		['apple, Ctrl and Alt', true, 'Ctrl+Alt+K', '⌃⌥K'],
	])('writes the modifier as the platform does: %s', (_name, apple, keys, label) => {
		expect(shortcutLabel(keys, apple)).toBe(label)
	})
})
