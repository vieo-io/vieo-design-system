import { flush } from 'solid-js'

/** Applies pending writes, then waits out the two frames the focus primitives wait before moving focus. */
export async function settle(): Promise<void> {
	flush()
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	flush()
}
