import type { ComponentProps } from '@solidjs/web'
import { omit } from 'solid-js'

export type ButtonProps = ComponentProps<'button'> & {
	size?: 'md' | 'sm'
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button(props: ButtonProps) {
	const rest = omit(props, 'class', 'size', 'type', 'variant')
	return (
		<button
			type={props.type ?? 'button'}
			class={[
				'vds-button',
				`vds-button--${props.variant ?? 'secondary'}`,
				{ 'vds-button--sm': props.size === 'sm' },
				props.class,
			]}
			{...rest}
		/>
	)
}
