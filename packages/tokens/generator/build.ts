import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
	renderDesignsCss,
	renderIndexDts,
	renderIndexJs,
	renderPalettesCss,
	renderTokensCss,
} from './render.ts'
import { loadSource } from './source.ts'

const OUTPUTS = {
	'designs.css': renderDesignsCss,
	'index.d.ts': renderIndexDts,
	'index.js': renderIndexJs,
	'palettes.css': renderPalettesCss,
	'tokens.css': renderTokensCss,
} as const

const source = loadSource(fileURLToPath(new URL('../src', import.meta.url)))
const dist = fileURLToPath(new URL('../dist', import.meta.url))
mkdirSync(dist, { recursive: true })
for (const [file, render] of Object.entries(OUTPUTS))
	writeFileSync(`${dist}/${file}`, render(source))
