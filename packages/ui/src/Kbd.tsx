export type KbdProps = {
	/** Keys joined with `+`, such as `Mod+K`. */
	keys: string
}

/** A keyboard shortcut as the person's platform writes it. */
export function Kbd(props: KbdProps) {
	return <kbd class='vds-kbd'>{shortcutLabel(props.keys, isApple())}</kbd>
}

/** `Mod+Shift+K` as `⌘⇧K` on Apple platforms and `Ctrl+Shift+K` elsewhere. */
export function shortcutLabel(keys: string, apple: boolean): string {
	const names: Record<string, [string, string]> = {
		mod: ['⌘', 'Ctrl'],
		shift: ['⇧', 'Shift'],
		alt: ['⌥', 'Alt'],
		ctrl: ['⌃', 'Ctrl'],
	}
	const parts = keys
		.split('+')
		.map((key) => names[key.toLowerCase()]?.[apple ? 0 : 1] ?? keyName(key))
	return parts.join(apple ? '' : '+')
}

function isApple(): boolean {
	return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
}

/** A letter in capitals, as keycaps print it, and a named key such as Enter with a capital. */
function keyName(key: string): string {
	return key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1)
}
