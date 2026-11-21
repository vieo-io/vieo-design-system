import type { Placement } from '@floating-ui/dom'
import { type JSX, Portal, Show } from '@solidjs/web'
import { createEffect, createSignal, createUniqueId, onSettled } from 'solid-js'
import { place } from './layers'
import type { TriggerProps } from './trigger'

export type TooltipProps = {
	children: (props: TriggerProps) => JSX.Element
	content: string
	placement?: Placement
}

/** How long the pointer rests on a trigger before its tooltip shows. Keyboard focus shows it at once. */
const HOVER_DELAY_MS = 500

/** A short label shown on hover or keyboard focus, and hidden on Escape. */
export function Tooltip(props: TooltipProps) {
	const id = createUniqueId()
	const [open, setOpen] = createSignal(false)
	const [anchor, setAnchor] = createSignal<HTMLElement>()
	const [content, setContent] = createSignal<HTMLElement>()
	let timer: ReturnType<typeof setTimeout> | undefined
	const show = (delay: number) => {
		clearTimeout(timer)
		if (delay) timer = setTimeout(() => setOpen(true), delay)
		else setOpen(true)
	}
	const hide = () => {
		clearTimeout(timer)
		setOpen(false)
	}
	onSettled(() => () => clearTimeout(timer))
	createEffect(
		() => ({ open: open(), anchor: anchor(), content: content() }),
		(now) => {
			if (!now.open || !now.anchor || !now.content) return
			return place(now.anchor, now.content, props.placement ?? 'top')
		},
	)
	return (
		<>
			{props.children({
				ref: setAnchor,
				get 'aria-describedby'() {
					return open() ? id : undefined
				},
				onPointerEnter: () => show(HOVER_DELAY_MS),
				onPointerLeave: hide,
				onFocus: () => show(0),
				onBlur: hide,
				onKeyDown: (event) => {
					if (event.key === 'Escape') hide()
				},
			})}
			<Show when={open()}>
				<Portal>
					<div ref={setContent} id={id} class='vds-tooltip' role='tooltip'>
						{props.content}
					</div>
				</Portal>
			</Show>
		</>
	)
}
