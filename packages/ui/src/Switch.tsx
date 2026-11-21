import type { ComponentProps } from '@solidjs/web'
import { omit } from 'solid-js'

export type SwitchProps = Omit<ComponentProps<'input'>, 'onChange' | 'role' | 'type'> & {
	checked: boolean
	onChange: (checked: boolean) => void
}

/**
 * An on-off switch: a native checkbox with the switch role, so it works in a form and with a label.
 * Name it with `aria-label`, a wrapping `<label>`, or a SettingRow's props.
 */
export function Switch(props: SwitchProps) {
	const rest = omit(props, 'checked', 'class', 'onChange')
	return (
		<input
			type='checkbox'
			// biome-ignore lint/a11y/useAriaPropsForRole: a native checkbox exposes its own checked state, which aria-checked would duplicate.
			role='switch'
			class={['vds-switch', props.class]}
			checked={props.checked}
			onChange={(event) => props.onChange(event.currentTarget.checked)}
			{...rest}
		/>
	)
}
