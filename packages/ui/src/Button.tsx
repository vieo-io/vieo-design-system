import { type ComponentProps, Show } from '@solidjs/web'
import { omit } from 'solid-js'
import { Icon, type IconName } from './Icon'

export type ButtonProps = ComponentProps<'button'> & {
	/** Drawn before the label. */
	icon?: IconName
	size?: 'md' | 'sm'
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button(props: ButtonProps) {
	const rest = omit(props, 'children', 'class', 'icon', 'size', 'type', 'variant')
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
		>
			<Show when={props.icon}>
				{(name) => (
					<Icon
						name={name()}
						class='vds-button__icon'
						size={props.size === 'sm' ? 'var(--icon-size-sm)' : undefined}
					/>
				)}
			</Show>
			{props.children}
		</button>
	)
}
