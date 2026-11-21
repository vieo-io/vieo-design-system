import type { ComponentProps } from '@solidjs/web'
import { omit } from 'solid-js'
import { PATHS } from './paths'

export type IconName = keyof typeof PATHS

export type IconProps = Omit<ComponentProps<'svg'>, 'name'> & {
	name: IconName
	/** A CSS length. Defaults to `--icon-size`. */
	size?: string
}

/** An inline SVG icon in `currentColor`, hidden from assistive technology. */
export function Icon(props: IconProps) {
	const rest = omit(props, 'class', 'name', 'size', 'style')
	return (
		<svg
			class={['vds-icon', props.class]}
			style={{ '--vds-icon-size': props.size }}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			stroke-width='1.7'
			stroke-linecap='round'
			stroke-linejoin='round'
			aria-hidden='true'
			{...rest}
		>
			<path d={PATHS[props.name]} />
		</svg>
	)
}

export function iconNames(): IconName[] {
	return Object.keys(PATHS) as IconName[]
}
