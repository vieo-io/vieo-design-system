import { type JSX, Show } from '@solidjs/web'
import { onSettled } from 'solid-js'
import { moveFor } from './roving'

export type ToolbarProps = {
	/** The trailing actions, an overflow menu's trigger last. */
	children?: JSX.Element
	/** Names the toolbar for assistive technology. */
	label: string
	/** Before the title, such as a back or a sidebar button. */
	leading?: JSX.Element
	/** Beside the title in muted text, such as what kind of page it is. */
	subtitle?: string
	title?: string
}

const CONTROLS = 'button, a[href], input, select, textarea, [role="button"], [role="switch"]'

/** Fields whose arrow keys move within them, which the toolbar leaves alone. */
const TEXT_ENTRY = 'input:not([type="button"], [type="checkbox"], [type="radio"]), textarea, select'

/**
 * A page's header bar: leading controls, a title, and trailing actions. It is one tab stop, and arrow keys, Home,
 * and End move between its controls, as in the WAI-ARIA toolbar pattern.
 */
export function Toolbar(props: ToolbarProps) {
	let root: HTMLDivElement | undefined
	let current: HTMLElement | undefined
	const controls = () => (root ? [...root.querySelectorAll<HTMLElement>(CONTROLS)] : [])
	const enabled = (control: HTMLElement) =>
		!control.hasAttribute('disabled') && control.getAttribute('aria-disabled') !== 'true'
	const applyStops = () => {
		const all = controls()
		if (!current || !all.includes(current) || !enabled(current)) current = all.find(enabled)
		for (const control of all) control.tabIndex = control === current ? 0 : -1
	}
	onSettled(() => {
		applyStops()
		const observer = new MutationObserver(applyStops)
		if (root)
			observer.observe(root, {
				attributes: true,
				attributeFilter: ['disabled', 'aria-disabled'],
				childList: true,
				subtree: true,
			})
		return () => observer.disconnect()
	})
	const onFocusIn = (event: FocusEvent) => {
		const target = event.target as HTMLElement
		if (!controls().includes(target)) return
		current = target
		applyStops()
	}
	const onKeyDown = (event: KeyboardEvent) => {
		const target = event.target as HTMLElement
		if (target.matches(TEXT_ENTRY)) return
		const all = controls()
		const move = moveFor(
			event.key,
			all.map((control) => ({ disabled: !enabled(control) })),
			all.indexOf(target),
			'horizontal',
		)
		if (move === undefined) return
		event.preventDefault()
		all[move]?.focus()
	}
	return (
		<div
			ref={root}
			class='vds-toolbar'
			role='toolbar'
			aria-label={props.label}
			onFocusIn={onFocusIn}
			onKeyDown={onKeyDown}
		>
			<Show when={props.leading}>
				<div class='vds-toolbar__leading'>{props.leading}</div>
			</Show>
			<div class='vds-toolbar__title'>
				<Show when={props.title}>
					<h1 class='vds-toolbar__heading'>{props.title}</h1>
				</Show>
				<Show when={props.subtitle}>
					<span class='vds-toolbar__subtitle'>{props.subtitle}</span>
				</Show>
			</div>
			<div class='vds-toolbar__actions'>{props.children}</div>
		</div>
	)
}
