import { Show } from '@solidjs/web'
import { createSignal, createUniqueId } from 'solid-js'
import { aria } from './aria'

export type TextFieldProps = {
	disabled?: boolean
	error?: string
	hint?: string
	label: string
	/** A textarea rather than a single line. */
	multiline?: boolean
	/** Called with the text once it's committed: on blur, or Enter in a single line. */
	onChange: (value: string) => void
	/** Called on every keystroke, for a caller that validates as the person types. */
	onInput?: (value: string) => void
	placeholder?: string
	type?: 'text' | 'email' | 'password' | 'search' | 'url'
	value: string
}

/**
 * A labelled text input with a hint and an error read along with it. Typing goes to a draft that
 * follows `value` whenever the caller changes it, so typed text survives any other prop changing.
 */
export function TextField(props: TextFieldProps) {
	const id = createUniqueId()
	const [draft, setDraft] = createSignal(() => props.value)
	const describedBy = () =>
		[props.hint && `${id}-hint`, props.error && `${id}-error`].filter(Boolean).join(' ') ||
		undefined
	const onInput = (
		event: InputEvent & { currentTarget: HTMLInputElement | HTMLTextAreaElement },
	) => {
		setDraft(event.currentTarget.value)
		props.onInput?.(event.currentTarget.value)
	}
	const onChange = (event: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
		props.onChange(event.currentTarget.value)
	return (
		<div class={['vds-field', { 'vds-field--invalid': !!props.error }]}>
			<label class='vds-field__label' for={`${id}-input`}>
				{props.label}
			</label>
			<Show
				when={props.multiline}
				fallback={
					<input
						id={`${id}-input`}
						class='vds-field__input'
						type={props.type ?? 'text'}
						value={draft()}
						placeholder={props.placeholder}
						disabled={props.disabled}
						aria-invalid={aria(!!props.error)}
						aria-describedby={describedBy()}
						onInput={onInput}
						onChange={onChange}
					/>
				}
			>
				<textarea
					id={`${id}-input`}
					class='vds-field__input vds-field__input--multiline'
					value={draft()}
					placeholder={props.placeholder}
					disabled={props.disabled}
					aria-invalid={aria(!!props.error)}
					aria-describedby={describedBy()}
					onInput={onInput}
					onChange={onChange}
				/>
			</Show>
			<Show when={props.hint}>
				<span id={`${id}-hint`} class='vds-field__hint'>
					{props.hint}
				</span>
			</Show>
			<Show when={props.error}>
				<span id={`${id}-error`} class='vds-field__error'>
					{props.error}
				</span>
			</Show>
		</div>
	)
}
