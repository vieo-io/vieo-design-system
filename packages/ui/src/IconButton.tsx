import type { Placement } from '@floating-ui/dom'
import { Show } from '@solidjs/web'
import { merge, omit } from 'solid-js'
import { Button, type ButtonProps } from './Button'
import type { IconName } from './Icon'
import { Tooltip } from './Tooltip'

export type IconButtonProps = Omit<ButtonProps, 'children' | 'icon'> & {
	icon: IconName
	/** The button's name, read by assistive technology and shown in its tooltip. */
	label: string
	/** Shows the label beside the icon while the toolbar it sits in has room, for an icon that isn't clear alone. */
	showLabel?: boolean
	tooltipPlacement?: Placement
}

/**
 * A button drawn as an icon, with its label in a tooltip. With `showLabel` the label shows beside the icon until
 * the toolbar narrows, and the tooltip opens only once it has gone.
 */
export function IconButton(props: IconButtonProps) {
	const rest = omit(props, 'class', 'label', 'showLabel', 'tooltipPlacement')
	let label: HTMLSpanElement | undefined
	const collapsed = () =>
		!label || getComputedStyle(label).getPropertyValue('--vds-collapsed').trim() === '1'
	return (
		<Tooltip
			content={props.label}
			placement={props.tooltipPlacement ?? 'bottom'}
			when={() => !props.showLabel || collapsed()}
		>
			{(trigger) => (
				<Button
					{...merge(rest, trigger)}
					class={[
						props.showLabel ? 'vds-button--collapse' : 'vds-button--icon',
						props.class,
					]}
					aria-label={props.showLabel ? undefined : props.label}
				>
					<Show when={props.showLabel}>
						<span ref={label} class='vds-button__label'>
							{props.label}
						</span>
					</Show>
				</Button>
			)}
		</Tooltip>
	)
}
