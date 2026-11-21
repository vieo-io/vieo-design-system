import { DESIGNS, PALETTES } from '@vieo-io/tokens'

export type Look = { design: string; palette: string; theme: string }

/** The look named in the address, which a screenshot run sets. Absent means Classic, Paper, and the machine's theme. */
export function lookFromUrl(): Look {
	const params = new URL(location.href).searchParams
	return {
		design: pick(params.get('design'), DESIGNS, 'classic'),
		palette: pick(params.get('palette'), PALETTES, 'paper'),
		theme: pick(params.get('theme'), ['system', 'light', 'dark'], 'system'),
	}
}

/** Sets the root attributes the apps set, and keeps the address in step so a reload keeps the look. */
export function applyLook(look: Look): void {
	const root = document.documentElement
	const set = (name: string, value: string, absent: string) => {
		if (value === absent) root.removeAttribute(name)
		else root.setAttribute(name, value)
	}
	set('data-design', look.design, 'classic')
	set('data-palette', look.palette, 'paper')
	set('data-theme', look.theme, 'system')
	const url = new URL(location.href)
	for (const [key, value] of Object.entries(look)) url.searchParams.set(key, value)
	history.replaceState(null, '', url)
}

export function label(name: string): string {
	return name.charAt(0).toUpperCase() + name.slice(1)
}

function pick(value: string | null, allowed: readonly string[], fallback: string): string {
	return value && allowed.includes(value) ? value : fallback
}
