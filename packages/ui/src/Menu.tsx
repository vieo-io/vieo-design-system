import type { Placement } from '@floating-ui/dom'
import { For, type JSX, Portal, Show } from '@solidjs/web'
import { createEffect, createSignal, createUniqueId, onFlush } from 'solid-js'
import { aria } from './aria'
import { Icon, type IconName } from './Icon'
import { closeOnOutside, place } from './layers'
import { first, moveFor, rows, typeahead } from './roving'
import type { TriggerProps } from './trigger'

export type MenuItem = {
	danger?: boolean
	disabled?: boolean
	icon?: IconName
	label: string
	onSelect: () => void
}

export type MenuProps = {
	items: MenuItem[]
	/** Names the menu for assistive technology. */
	label: string
	placement?: Placement
	trigger: (props: TriggerProps) => JSX.Element
}

/**
 * A menu of actions. Arrow keys, Home, End, and a typed letter move between items; Enter or a click
 * runs one. Escape, Tab, and a click elsewhere close it, and Escape and a choice return focus to the
 * trigger.
 */
export function Menu(props: MenuProps) {
	const id = createUniqueId()
	const [open, setOpen] = createSignal(false)
	const [anchor, setAnchor] = createSignal<HTMLElement>()
	const [content, setContent] = createSignal<HTMLElement>()
	const elements = (menu = content()) => rows(menu, 'menuitem')
	const focused = () => elements().indexOf(document.activeElement as HTMLElement)
	const close = (refocus: boolean) => {
		setOpen(false)
		if (refocus) anchor()?.focus()
	}
	createEffect(
		() => ({ open: open(), anchor: anchor(), content: content() }),
		(now) => {
			if (!now.open || !now.anchor || !now.content) return
			const stopPlacing = place(now.anchor, now.content, props.placement ?? 'bottom-start')
			const stopListening = closeOnOutside(
				() => [now.anchor, now.content],
				() => close(false),
			)
			elements(now.content)[first(props.items)]?.focus()
			return () => {
				stopPlacing()
				stopListening()
			}
		},
	)
	const choose = (item: MenuItem) => {
		if (item.disabled) return
		onFlush(() => close(true))
		item.onSelect()
	}
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault()
			close(true)
			return
		}
		if (event.key === 'Tab') {
			close(false)
			return
		}
		const move = moveFor(event.key, props.items, focused())
		if (move !== undefined) {
			event.preventDefault()
			elements()[move]?.focus()
			return
		}
		if (event.key.length === 1 && /\S/.test(event.key)) {
			const at = typeahead(props.items, focused(), event.key)
			if (at >= 0) elements()[at]?.focus()
		}
	}
	const onTriggerKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
		event.preventDefault()
		setOpen(true)
	}
	return (
		<>
			{props.trigger({
				ref: setAnchor,
				'aria-haspopup': 'menu',
				get 'aria-expanded'() {
					return aria(open())
				},
				'aria-controls': id,
				onClick: () => setOpen((was) => !was),
				onKeyDown: onTriggerKeyDown,
			})}
			<Show when={open()}>
				<Portal>
					<div
						ref={setContent}
						id={id}
						class='vds-menu'
						role='menu'
						aria-label={props.label}
						onKeyDown={onKeyDown}
					>
						<For each={props.items}>
							{(item) => (
								<button
									type='button'
									class={[
										'vds-menu__item',
										{ 'vds-menu__item--danger': item.danger },
									]}
									role='menuitem'
									tabindex='-1'
									aria-disabled={aria(item.disabled)}
									onClick={() => choose(item)}
								>
									<Show when={item.icon}>{(name) => <Icon name={name()} />}</Show>
									{item.label}
								</button>
							)}
						</For>
					</div>
				</Portal>
			</Show>
		</>
	)
}
