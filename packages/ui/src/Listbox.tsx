import { For, Show } from '@solidjs/web'
import { createSignal } from 'solid-js'
import { aria } from './aria'
import { first, moveFor, rows } from './roving'

export type ListboxOption = {
	description?: string
	disabled?: boolean
	label: string
	value: string
}

export type ListboxProps = {
	/** Names the list for assistive technology. */
	label: string
	onChange: (value: string) => void
	options: ListboxOption[]
	value?: string
}

/**
 * A single-choice list with roving focus: one option is in the tab order, arrow keys, Home, and End
 * move between the enabled ones, and Enter, Space, or a click chooses.
 */
export function Listbox(props: ListboxProps) {
	let list: HTMLDivElement | undefined
	const elements = () => rows(list, 'option')
	const [active, setActive] = createSignal(() => {
		const chosen = props.options.findIndex((option) => option.value === props.value)
		return chosen >= 0 ? chosen : first(props.options)
	})
	const onKeyDown = (event: KeyboardEvent) => {
		const from = elements().indexOf(document.activeElement as HTMLElement)
		const move = moveFor(event.key, props.options, from)
		if (move !== undefined && move >= 0) {
			event.preventDefault()
			setActive(move)
			elements()[move]?.focus()
			return
		}
		const option = props.options[from]
		if ((event.key === 'Enter' || event.key === ' ') && option && !option.disabled) {
			event.preventDefault()
			props.onChange(option.value)
		}
	}
	return (
		<div
			ref={list}
			class='vds-listbox'
			role='listbox'
			aria-label={props.label}
			onKeyDown={onKeyDown}
		>
			<For each={props.options}>
				{(option, index) => (
					// biome-ignore lint/a11y/useFocusableInteractive lint/a11y/useKeyWithClickEvents: the tabindex is set below, and the list handles the keys.
					<div
						class='vds-listbox__option'
						role='option'
						aria-selected={aria(option.value === props.value)}
						aria-disabled={aria(option.disabled)}
						tabindex={index() === active() ? '0' : '-1'}
						onClick={() => {
							if (option.disabled) return
							setActive(index())
							props.onChange(option.value)
						}}
					>
						<span class='vds-listbox__label'>{option.label}</span>
						<Show when={option.description}>
							<span class='vds-listbox__description'>{option.description}</span>
						</Show>
					</div>
				)}
			</For>
		</div>
	)
}
