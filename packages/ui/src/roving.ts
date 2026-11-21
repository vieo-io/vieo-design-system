/** Something a list can move to unless it's disabled. */
export type Item = { disabled?: boolean }

/** The first index from `from` in the direction of `step` that is enabled, or `from` itself at either end. */
export function step(items: readonly Item[], from: number, step: 1 | -1): number {
	for (let at = from + step; at >= 0 && at < items.length; at += step)
		if (!items[at]?.disabled) return at
	return from
}

/** The elements of one role inside `container`, in document order, which is the order of its items. */
export function rows(container: Element | undefined, role: string): HTMLElement[] {
	return container ? [...container.querySelectorAll<HTMLElement>(`[role='${role}']`)] : []
}

/** The first enabled index, or -1 when every item is disabled or there are none. */
export function first(items: readonly Item[]): number {
	return items.findIndex((item) => !item.disabled)
}

/** The last enabled index, or -1 when every item is disabled or there are none. */
export function last(items: readonly Item[]): number {
	return items.findLastIndex((item) => !item.disabled)
}

/**
 * The index a list key moves to from `from`, or `undefined` for a key lists don't handle. Arrows stop
 * at each end.
 */
export function moveFor(
	key: string,
	items: readonly Item[],
	from: number,
	orientation: 'horizontal' | 'vertical' = 'vertical',
): number | undefined {
	const [back, forward] =
		orientation === 'vertical' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']
	if (key === 'Home') return first(items)
	if (key === 'End') return last(items)
	if (from < 0 && (key === forward || key === back))
		return key === forward ? first(items) : last(items)
	if (key === forward) return step(items, from, 1)
	if (key === back) return step(items, from, -1)
	return undefined
}

/** The next enabled item after `from` whose label starts with `letter`, wrapping round, or -1. */
export function typeahead(
	items: readonly (Item & { label: string })[],
	from: number,
	letter: string,
): number {
	const wanted = letter.toLowerCase()
	for (let offset = 1; offset <= items.length; offset++) {
		const at = (from + offset + items.length) % items.length
		const item = items[at]
		if (item && !item.disabled && item.label.toLowerCase().startsWith(wanted)) return at
	}
	return -1
}
