import { autoUpdate, computePosition, flip, offset, type Placement, shift } from '@floating-ui/dom'

/** Open modal dialogs, oldest first, so only the top one answers Escape. */
const DIALOGS: object[] = []

export function closeOnOutside(
	inside: () => (Element | undefined)[],
	close: () => void,
): () => void {
	const onPointerDown = (event: PointerEvent) => {
		const target = event.target as Node | null
		if (target && inside().some((element) => element?.contains(target))) return
		close()
	}
	document.addEventListener('pointerdown', onPointerDown, true)
	return () => document.removeEventListener('pointerdown', onPointerDown, true)
}

export function isTopDialog(dialog: object): boolean {
	return DIALOGS.at(-1) === dialog
}

/** Keeps `floating` beside `anchor` until the returned cleanup runs. */
export function place(anchor: Element, floating: HTMLElement, placement: Placement): () => void {
	return autoUpdate(anchor, floating, () => {
		void computePosition(anchor, floating, {
			placement,
			strategy: 'fixed',
			middleware: [offset(6), flip(), shift({ padding: 8 })],
		}).then(({ x, y }) => {
			floating.style.left = `${x}px`
			floating.style.top = `${y}px`
		})
	})
}

/** Puts `dialog` on top of the stack until the returned cleanup runs. */
export function pushDialog(dialog: object): () => void {
	DIALOGS.push(dialog)
	return () => {
		const at = DIALOGS.indexOf(dialog)
		if (at >= 0) DIALOGS.splice(at, 1)
	}
}
