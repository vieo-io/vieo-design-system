import { For, Show } from '@solidjs/web'
import { aria } from './aria'
import { Icon, type IconName } from './Icon'
import { first, moveFor, rows } from './roving'

export type SegmentedControlProps = {
	/** Names the group for assistive technology. */
	label: string
	onChange: (value: string) => void
	options: SegmentedOption[]
	value: string
}

export type SegmentedOption = {
	disabled?: boolean
	icon?: IconName
	label: string
	value: string
}

/**
 * A row of mutually exclusive options, as a radio group. The chosen option is the one tab stop, and
 * arrow keys, Home, and End choose the next enabled option as they move.
 */
export function SegmentedControl(props: SegmentedControlProps) {
	let group: HTMLDivElement | undefined
	const tabStop = () => {
		const chosen = props.options.findIndex(
			(option) => option.value === props.value && !option.disabled,
		)
		return chosen >= 0 ? chosen : first(props.options)
	}
	const onKeyDown = (event: KeyboardEvent) => {
		const from = props.options.findIndex((option) => option.value === props.value)
		const move =
			moveFor(event.key, props.options, from, 'horizontal') ??
			moveFor(event.key, props.options, from, 'vertical')
		const option = move === undefined ? undefined : props.options[move]
		if (move === undefined || !option) return
		event.preventDefault()
		rows(group, 'radio')[move]?.focus()
		if (option.value !== props.value) props.onChange(option.value)
	}
	return (
		<div
			ref={group}
			class='vds-segmented'
			role='radiogroup'
			aria-label={props.label}
			onKeyDown={onKeyDown}
		>
			<For each={props.options}>
				{(option, index) => (
					// biome-ignore lint/a11y/useSemanticElements: a segment is a button styled as one of a row, and the group handles the arrow keys.
					<button
						type='button'
						class='vds-segmented__option'
						role='radio'
						aria-checked={aria(option.value === props.value)}
						tabindex={index() === tabStop() ? '0' : '-1'}
						disabled={option.disabled}
						onClick={() => props.onChange(option.value)}
					>
						<Show when={option.icon}>
							{(name) => <Icon name={name()} size='var(--icon-size-sm)' />}
						</Show>
						{option.label}
					</button>
				)}
			</For>
		</div>
	)
}
