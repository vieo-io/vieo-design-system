import { createFocusTrap } from '@solid-primitives/focus'
import { type JSX, Portal, Show } from '@solidjs/web'
import { createEffect, createSignal, createUniqueId } from 'solid-js'
import { isTopDialog, pushDialog } from './layers'

export type DialogProps = {
	children: JSX.Element
	description?: string
	onOpenChange: (open: boolean) => void
	open: boolean
	title: string
}

/**
 * A modal dialog. Escape or a click on the backdrop closes the top dialog only, focus stays inside
 * while it's open, and focus goes back to whatever had it before the dialog opened.
 */
export function Dialog(props: DialogProps) {
	const id = createUniqueId()
	const [panel, setPanel] = createSignal<HTMLElement>()
	const self = {}
	createFocusTrap({ element: panel, enabled: () => props.open })
	createEffect(
		() => props.open,
		(open) => (open ? pushDialog(self) : undefined),
	)
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape' || !isTopDialog(self)) return
		event.preventDefault()
		props.onOpenChange(false)
	}
	return (
		<Show when={props.open}>
			<Portal>
				<div class='vds-dialog-backdrop' onPointerDown={() => props.onOpenChange(false)} />
				<div
					ref={setPanel}
					class='vds-dialog'
					role='dialog'
					aria-modal='true'
					aria-labelledby={`${id}-title`}
					aria-describedby={props.description ? `${id}-description` : undefined}
					tabindex='-1'
					onKeyDown={onKeyDown}
				>
					<h2 id={`${id}-title`} class='vds-dialog__title'>
						{props.title}
					</h2>
					<Show when={props.description}>
						<p id={`${id}-description`} class='vds-dialog__description'>
							{props.description}
						</p>
					</Show>
					{props.children}
				</div>
			</Portal>
		</Show>
	)
}
