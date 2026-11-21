import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [solid()],
	server: { port: 4400, strictPort: true },
	preview: { port: 4401, strictPort: true },
})
