import { type JSX, Show } from '@solidjs/web'
import { createUniqueId } from 'solid-js'

/** What the row's control must carry so the row's label and hint name and describe it. */
export type SettingControlProps = {
	'aria-describedby'?: string
	'aria-labelledby': string
}

export type SettingRowProps = {
	children: (props: SettingControlProps) => JSX.Element
	hint?: string
	label: string
	/** Puts the control under the label rather than beside it, for a wide control such as a text field. */
	stacked?: boolean
}

/** A setting: its label and hint on the left, its control on the right, wrapping when the row is narrow. */
export function SettingRow(props: SettingRowProps) {
	const id = createUniqueId()
	return (
		<div class={['vds-setting', { 'vds-setting--stacked': props.stacked }]}>
			<div class='vds-setting__text'>
				<span id={`${id}-label`} class='vds-setting__label'>
					{props.label}
				</span>
				<Show when={props.hint}>
					<span id={`${id}-hint`} class='vds-setting__hint'>
						{props.hint}
					</span>
				</Show>
			</div>
			<div class='vds-setting__control'>
				{props.children({
					'aria-labelledby': `${id}-label`,
					get 'aria-describedby'() {
						return props.hint ? `${id}-hint` : undefined
					},
				})}
			</div>
		</div>
	)
}
