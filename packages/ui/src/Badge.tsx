import type { JSX } from '@solidjs/web'

export type BadgeProps = {
	children: JSX.Element
	tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
}

/** A short label beside a title or in a row: a type, a count, or a state. */
export function Badge(props: BadgeProps) {
	return (
		<span class={['vds-badge', `vds-badge--${props.tone ?? 'neutral'}`]}>{props.children}</span>
	)
}
