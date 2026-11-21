import type { ComponentProps } from '@solidjs/web'
import { omit } from 'solid-js'

export type CheckboxProps = Omit<ComponentProps<'input'>, 'onChange' | 'type'> & {
	checked: boolean
	label: string
	onChange: (checked: boolean) => void
}

/** A native checkbox, restyled, with its label beside it. */
export function Checkbox(props: CheckboxProps) {
	const rest = omit(props, 'checked', 'class', 'label', 'onChange')
	return (
		<label class={['vds-checkbox', props.class]}>
			<input
				type='checkbox'
				class='vds-checkbox__input'
				checked={props.checked}
				onChange={(event) => props.onChange(event.currentTarget.checked)}
				{...rest}
			/>
			<span class='vds-checkbox__label'>{props.label}</span>
		</label>
	)
}
