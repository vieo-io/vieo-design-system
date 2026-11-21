import type { JSX } from '@solidjs/web'

/** What a component's trigger element must carry. Spread it onto the element. */
export type TriggerProps = {
	'aria-controls'?: string
	'aria-describedby'?: string
	'aria-expanded'?: 'true' | 'false'
	'aria-haspopup'?: 'menu' | 'dialog'
	onBlur?: JSX.EventHandler<HTMLElement, FocusEvent>
	onClick?: JSX.EventHandler<HTMLElement, MouseEvent>
	onFocus?: JSX.EventHandler<HTMLElement, FocusEvent>
	onKeyDown?: JSX.EventHandler<HTMLElement, KeyboardEvent>
	onPointerEnter?: JSX.EventHandler<HTMLElement, PointerEvent>
	onPointerLeave?: JSX.EventHandler<HTMLElement, PointerEvent>
	ref: (element: HTMLElement) => void
}
