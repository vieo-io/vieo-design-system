import { type ComponentProps, For } from '@solidjs/web'
import { omit } from 'solid-js'
import { Icon } from './Icon'

export type SelectOption = { disabled?: boolean; label: string; value: string }

export type SelectProps = Omit<ComponentProps<'select'>, 'onChange' | 'value'> & {
	onChange: (value: string) => void
	options: SelectOption[]
	value: string
}

/** A native select with a chevron, so the platform's own picker opens on every device. */
export function Select(props: SelectProps) {
	const rest = omit(props, 'class', 'onChange', 'options', 'value')
	return (
		<span class={['vds-select', props.class]}>
			<select
				class='vds-select__input'
				value={props.value}
				onChange={(event) => props.onChange(event.currentTarget.value)}
				{...rest}
			>
				<For each={props.options}>
					{(option) => (
						<option value={option.value} disabled={option.disabled}>
							{option.label}
						</option>
					)}
				</For>
			</select>
			<Icon name='chevron-down' class='vds-select__chevron' size='var(--icon-size-sm)' />
		</span>
	)
}
