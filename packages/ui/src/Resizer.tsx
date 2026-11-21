export type ResizerProps = {
	/** Names what it resizes, for assistive technology. */
	label: string
	max: number
	min: number
	onChange: (value: number) => void
	/** The width a double-click goes back to. */
	reset: number
	/** Pixels per arrow key. */
	step?: number
	value: number
}

const STEP = 16

/**
 * A drag handle between two panes, as a focusable separator. Arrow keys step it, Home and End reach its limits,
 * and a double-click resets it.
 */
export function Resizer(props: ResizerProps) {
	const clamp = (value: number) => Math.min(props.max, Math.max(props.min, Math.round(value)))
	const onKeyDown = (event: KeyboardEvent) => {
		const step = props.step ?? STEP
		const next = {
			ArrowLeft: props.value - step,
			ArrowDown: props.value - step,
			ArrowRight: props.value + step,
			ArrowUp: props.value + step,
			Home: props.min,
			End: props.max,
		}[event.key]
		if (next === undefined) return
		event.preventDefault()
		props.onChange(clamp(next))
	}
	const onPointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return
		event.preventDefault()
		const handle = event.currentTarget as HTMLElement
		const [startX, startValue] = [event.clientX, props.value]
		handle.setPointerCapture(event.pointerId)
		const onMove = (move: PointerEvent) =>
			props.onChange(clamp(startValue + move.clientX - startX))
		const onUp = () => {
			handle.removeEventListener('pointermove', onMove)
			handle.removeEventListener('pointerup', onUp)
			handle.removeEventListener('pointercancel', onUp)
		}
		handle.addEventListener('pointermove', onMove)
		handle.addEventListener('pointerup', onUp)
		handle.addEventListener('pointercancel', onUp)
	}
	return (
		// biome-ignore lint/a11y/useSemanticElements: an <hr> can't take focus or keys, and the pattern is a focusable separator.
		<div
			class='vds-resizer'
			role='separator'
			aria-label={props.label}
			aria-orientation='vertical'
			aria-valuenow={props.value}
			aria-valuemin={props.min}
			aria-valuemax={props.max}
			tabindex='0'
			onKeyDown={onKeyDown}
			onPointerDown={onPointerDown}
			onDblClick={() => props.onChange(clamp(props.reset))}
		/>
	)
}
