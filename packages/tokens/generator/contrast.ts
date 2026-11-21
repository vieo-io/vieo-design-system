/** WCAG AA's ratio for body text. */
export const READABLE_TEXT = 4.5

/** The least a selection's fill stands out from the page behind it. */
export const SELECTION_ON_PAGE = 2

/** WCAG 2's contrast ratio between two `#rrggbb` colours, from 1 to 21. */
export function contrast(foreground: string, background: string): number {
	const [one, other] = [luminance(foreground), luminance(background)]
	return (Math.max(one, other) + 0.05) / (Math.min(one, other) + 0.05)
}

function luminance(hex: string): number {
	if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`${hex} is not a #rrggbb colour`)
	const channel = (at: number) => {
		const value = Number.parseInt(hex.slice(at, at + 2), 16) / 255
		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
	}
	return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}
