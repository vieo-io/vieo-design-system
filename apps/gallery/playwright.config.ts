import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	use: { baseURL: 'http://localhost:4400', viewport: { width: 1100, height: 800 } },
	webServer: {
		command: 'pnpm dev',
		url: 'http://localhost:4400',
		reuseExistingServer: false,
	},
})
