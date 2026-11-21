/** An ARIA state as the attribute needs it, since `false` on a JSX attribute leaves the attribute out. */
export function aria(value: boolean | undefined): 'true' | 'false' | undefined {
	if (value === undefined) return undefined
	return value ? 'true' : 'false'
}
