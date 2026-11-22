import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { Ajv2020 } from 'ajv/dist/2020.js'
import schema from '../schema/tokens.schema.json' with { type: 'json' }
import { contexts, describeContext, layersFor } from './cascade.ts'

export type Layer = {
	tokens: Token[]
}

export type Design = Look & { coarse: Layer }

export type Look = {
	name: string
	default: Layer
	dark: Layer
}

export type Source = {
	base: Token[]
	dark: Layer
	/** What every design starts from, and the touch floor restated after them all. */
	designBase: Design
	designs: Design[]
	palettes: Look[]
	order: { designs: string[]; palettes: string[] }
}

export type Token = {
	name: string
	group: string
	type: TokenType
	value: string
	description?: string
}

export type TokenType = (typeof schema.$defs.type.enum)[number]

type RawToken = { $type?: TokenType; $value: string; $description?: string }

type Tree = Record<string, Record<string, RawToken>>

/** What a design's own coarse mode may set: the heights a control's touch area surrounds. */
const DESIGN_COARSE_TOKENS = ['control-height', 'control-height-sm']

export const REFERENCE = /\{([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)\}/g

export class SourceError extends Error {
	override name = 'SourceError'
}

export function loadSource(dir: string): Source {
	const validator = new Validator()
	const base = flatten(validator.read(dir, 'base.json', 'base'), 'base.json')
	const known = new Map(base.map((token) => [token.name, token]))
	const order = validator.read(dir, 'order.json', 'order') as unknown as Source['order']

	const look = (file: string): Design => {
		const modes = validator.read(dir, file, 'modes') as unknown as Record<string, Tree>
		if (modes.coarse && !file.startsWith('designs/'))
			throw new SourceError(`${file}: only a design may set a coarse mode`)
		const controlsOnly = file !== 'designs/base.json'
		const stray = Object.values(modes.coarse ?? {})
			.flatMap((group) => Object.keys(group))
			.find((name) => controlsOnly && !DESIGN_COARSE_TOKENS.includes(name))
		if (stray)
			throw new SourceError(
				`${file}: a coarse mode sets only ${DESIGN_COARSE_TOKENS.join(' and ')}, not ${stray}`,
			)
		const own = new Map(known)
		const layer = (mode: string) =>
			overrides(modes[mode] ?? {}, `${file}: ${mode}`, base, own, mode === 'default')
		const result = {
			name: basename(file, '.json'),
			default: layer('default'),
			dark: layer('dark'),
			coarse: layer('coarse'),
		}
		checkReferences(file, own, [result.default, result.dark, result.coarse])
		return result
	}
	const looks = (folder: 'designs' | 'palettes', implied: string) => {
		const files = readdirSync(join(dir, folder))
			.filter(
				(file) => file.endsWith('.json') && !(folder === 'designs' && file === 'base.json'),
			)
			.map((file) => basename(file, '.json'))
		const unlisted = files.find((name) => !order[folder].includes(name))
		if (unlisted) throw new SourceError(`${folder}/${unlisted}.json is missing from order.json`)
		const missing = order[folder].find((name) => name !== implied && !files.includes(name))
		if (missing)
			throw new SourceError(
				`order.json lists ${missing}, which has no ${folder}/${missing}.json`,
			)
		return order[folder]
			.filter((name) => name !== implied)
			.map((name) => look(`${folder}/${name}.json`))
	}

	const dark = overrides(
		validator.read(dir, 'themes/dark.json', 'theme'),
		'themes/dark.json',
		base,
		new Map(known),
		false,
	)
	checkReferences('themes/dark.json', known, [dark])
	const source = {
		base,
		dark,
		designBase: look('designs/base.json'),
		designs: looks('designs', 'classic'),
		palettes: looks('palettes', 'paper'),
		order,
	}
	for (const context of contexts(source))
		checkCycles(describeContext(context), layersFor(source, context))
	return source
}

/** The CSS a token's value becomes, with each reference read through its custom property. */
export function toCss(value: string): string {
	return value.replace(REFERENCE, (_match, _group, name) => `var(--${name})`)
}

/**
 * Refuses a reference cycle in the values that apply together, since CSS would quietly give every
 * property in the cycle the guaranteed-invalid value.
 */
function checkCycles(where: string, layers: Layer[]): void {
	const values = new Map<string, string>()
	for (const layer of layers)
		for (const token of layer.tokens) values.set(token.name, token.value)
	const visiting = new Set<string>()
	const done = new Set<string>()
	const visit = (name: string, path: string[]): void => {
		if (done.has(name)) return
		if (visiting.has(name))
			throw new SourceError(`reference cycle ${[...path, name].join(' -> ')}, in ${where}`)
		visiting.add(name)
		for (const [, , target] of (values.get(name) ?? '').matchAll(REFERENCE))
			visit(target ?? '', [...path, name])
		visiting.delete(name)
		done.add(name)
	}
	for (const name of values.keys()) visit(name, [])
}

/** Refuses a reference to a token that the file can't see, or to one under another group. */
function checkReferences(file: string, known: Map<string, Token>, layers: Layer[]): void {
	for (const token of [...known.values(), ...layers.flatMap((layer) => layer.tokens)]) {
		for (const [reference, group, target] of token.value.matchAll(REFERENCE)) {
			const found = known.get(target ?? '')
			if (!found || found.group !== group)
				throw new SourceError(
					`${file}: ${token.name} refers to ${reference}, which no token defines`,
				)
		}
	}
}

function flatten(tree: Tree, file: string): Token[] {
	const tokens: Token[] = []
	const seen = new Set<string>()
	for (const [group, members] of Object.entries(tree)) {
		for (const [name, raw] of Object.entries(members)) {
			if (seen.has(name))
				throw new SourceError(
					`${file}: ${group}.${name} repeats a name another group holds`,
				)
			seen.add(name)
			// The schema requires a $type on every base token.
			tokens.push(token(group, name, raw, raw.$type as TokenType))
		}
	}
	return tokens
}

/**
 * A layer's tokens in base order, whatever order its file lists them in, then the tokens the file
 * defines for itself, by name. A file defines its own tokens with a `$type`, in its default mode only,
 * so each has a value in every theme.
 */
function overrides(
	tree: Tree,
	where: string,
	base: Token[],
	known: Map<string, Token>,
	mayDefine: boolean,
): Layer {
	const set: Token[] = []
	for (const [group, members] of Object.entries(tree)) {
		for (const [name, raw] of Object.entries(members)) {
			const existing = known.get(name)
			if (raw.$type) {
				if (!mayDefine)
					throw new SourceError(
						`${where}.${group}.${name} defines a token outside the default mode`,
					)
				if (existing)
					throw new SourceError(
						`${where}.${group}.${name} is already defined in group ${existing.group}`,
					)
				const own = token(group, name, raw, raw.$type)
				known.set(name, own)
				set.push(own)
				continue
			}
			if (!existing)
				throw new SourceError(`${where}.${group}.${name} sets a token the base lacks`)
			if (existing.group !== group)
				throw new SourceError(
					`${where}.${group}.${name} is in group ${existing.group} in the base`,
				)
			set.push({
				...existing,
				value: raw.$value,
				description: raw.$description ?? existing.description,
			})
		}
	}
	const rank = (token: Token) => {
		const at = base.findIndex((b) => b.name === token.name)
		return at < 0 ? base.length : at
	}
	return { tokens: set.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)) }
}

function token(group: string, name: string, raw: RawToken, type: TokenType): Token {
	return {
		name,
		group,
		type,
		value: raw.$value,
		...(raw.$description ? { description: raw.$description } : {}),
	}
}

class Validator {
	constructor() {
		this.ajv.addSchema(schema)
	}

	read(dir: string, file: string, kind: keyof typeof schema.$defs): Tree {
		const data: unknown = JSON.parse(readFileSync(join(dir, file), 'utf8'))
		const validate = this.ajv.getSchema(`${schema.$id}#/$defs/${kind}`)
		if (!validate) throw new Error(`The schema has no $defs/${kind}`)
		if (!validate(data)) {
			const [error] = validate.errors ?? []
			throw new SourceError(
				`${file}: ${error?.instancePath || '/'} ${error?.message ?? 'is invalid'}`,
			)
		}
		return data as Tree
	}

	private ajv = new Ajv2020({ allErrors: false, strict: true })
}
