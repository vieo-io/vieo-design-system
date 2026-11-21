import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [solid()],
	test: {
		environment: 'jsdom',
		globals: true,
		include: ['test/**/*.test.{ts,tsx}'],
		setupFiles: ['test/setup.ts'],
	},
})
