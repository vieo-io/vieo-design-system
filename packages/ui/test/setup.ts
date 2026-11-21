import { cleanup } from '@solidjs/testing-library'
import { afterEach, beforeEach, expect, vi } from 'vitest'

/** Solid's dev build reports each diagnostic as a console message that starts with its `[CODE]`. */
const DIAGNOSTIC = /^\[[A-Z][A-Z_]+\]/

let diagnostics: string[] = []

beforeEach(() => {
	diagnostics = []
	for (const method of ['warn', 'error'] as const) {
		const original = console[method]
		vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
			const message = args.map(String).join(' ')
			if (DIAGNOSTIC.test(message)) diagnostics.push(message)
			original(...args)
		})
	}
})

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
	expect(diagnostics, 'Solid dev diagnostics').toEqual([])
})
