import type { Placement } from '@floating-ui/dom'
import { type JSX, Portal, Show } from '@solidjs/web'
import { createEffect, createSignal, createUniqueId } from 'solid-js'
import { aria } from './aria'
import { closeOnOutside, place } from './layers'
import type { TriggerProps } from './trigger'

export type PopoverProps = {
	children: JSX.Element
	/** Names the popover for assistive technology. */
	label: string
	placement?: Placement
	trigger: (props: TriggerProps) => JSX.Element
}

/**
 * Content that floats beside its trigger. A click on the trigger toggles it; Escape closes it and
 * returns focus to the trigger, and a click elsewhere closes it and leaves focus where the click put it.
 */
export function Popover(props: PopoverProps) {
	const id = createUniqueId()
	const [open, setOpen] = createSignal(false)
	const [anchor, setAnchor] = createSignal<HTMLElement>()
	const [content, setContent] = createSignal<HTMLElement>()
	createEffect(
		() => ({ open: open(), anchor: anchor(), content: content() }),
		(now) => {
			if (!now.open || !now.anchor || !now.content) return
			const stopPlacing = place(now.anchor, now.content, props.placement ?? 'bottom-start')
			const stopListening = closeOnOutside(
				() => [now.anchor, now.content],
				() => setOpen(false),
			)
			now.content.focus()
			return () => {
				stopPlacing()
				stopListening()
			}
		},
	)
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape') return
		event.preventDefault()
		setOpen(false)
		anchor()?.focus()
	}
	return (
		<>
			{props.trigger({
				ref: setAnchor,
				'aria-haspopup': 'dialog',
				get 'aria-expanded'() {
					return aria(open())
				},
				'aria-controls': id,
				onClick: () => setOpen((was) => !was),
			})}
			<Show when={open()}>
				<Portal>
					<div
						ref={setContent}
						id={id}
						class='vds-popover'
						role='dialog'
						aria-label={props.label}
						tabindex='-1'
						onKeyDown={onKeyDown}
					>
						{props.children}
					</div>
				</Portal>
			</Show>
		</>
	)
}
