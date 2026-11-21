import { For, Show } from '@solidjs/web'
import { createEffect, createMemo, createSignal, createUniqueId } from 'solid-js'
import { aria } from './aria'
import { Icon, type IconName } from './Icon'
import { first, moveFor, rows } from './roving'

export type Command = {
	/** Listed but skipped by the arrow keys, and does nothing when chosen. */
	disabled?: boolean
	/** The heading the command is listed under. Groups keep the order they first appear in. */
	group?: string
	/** Shown at the row's end, such as a shortcut. */
	hint?: string
	icon?: IconName
	id: string
	/** Words that match the command without being shown. */
	keywords?: string[]
	label: string
	onSelect: () => void
}

export type CommandPaletteProps = {
	commands: Command[]
	/** Shown when nothing matches. */
	emptyText?: string
	/** Names the search field for assistive technology. */
	label: string
	onClose?: () => void
	placeholder?: string
}

type Group = { name: string | undefined; rows: { command: Command; index: number }[] }

/**
 * A search field over a list of commands, in the combobox pattern: focus stays in the field, arrow
 * keys move the highlighted command, and Enter runs it. Every word typed must appear in a command's
 * label or keywords.
 */
export function CommandPalette(props: CommandPaletteProps) {
	const id = createUniqueId()
	const [query, setQuery] = createSignal('')
	const results = createMemo(() => matching(props.commands, query()))
	const groups = createMemo(() => grouped(results()))
	/** The results in the order they're shown, which the highlight's index counts in. */
	const shown = createMemo(() =>
		groups().flatMap((group) => group.rows.map((row) => row.command)),
	)
	const [active, setActive] = createSignal<number>(() => first(shown()))
	let list: HTMLDivElement | undefined
	createEffect(
		() => active(),
		(at) => rows(list, 'option')[at]?.scrollIntoView?.({ block: 'nearest' }),
	)
	const run = (at: number) => {
		const command = shown()[at]
		if (command && !command.disabled) command.onSelect()
	}
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault()
			props.onClose?.()
			return
		}
		if (event.key === 'Enter') {
			event.preventDefault()
			run(active())
			return
		}
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
		const move = moveFor(event.key, shown(), active())
		if (move === undefined || move < 0) return
		event.preventDefault()
		setActive(move)
	}
	const optionId = (at: number) => `${id}-option-${at}`
	return (
		<div class='vds-palette'>
			<input
				class={['vds-palette__input', { 'vds-palette__input--empty': !results().length }]}
				type='text'
				role='combobox'
				aria-label={props.label}
				aria-expanded='true'
				aria-controls={`${id}-list`}
				aria-autocomplete='list'
				aria-activedescendant={active() >= 0 ? optionId(active()) : undefined}
				placeholder={props.placeholder}
				autocomplete='off'
				spellcheck={false}
				onInput={(event) => setQuery(event.currentTarget.value)}
				onKeyDown={onKeyDown}
			/>
			<div
				ref={list}
				id={`${id}-list`}
				class='vds-palette__list'
				role='listbox'
				aria-label={props.label}
			>
				<For each={groups()}>
					{(group) => (
						// biome-ignore lint/a11y/useSemanticElements: a listbox's groups take role group; a fieldset isn't allowed in one.
						<div class='vds-palette__group' role='group' aria-label={group.name}>
							<Show when={group.name}>
								<div class='vds-palette__heading' aria-hidden='true'>
									{group.name}
								</div>
							</Show>
							<For each={group.rows}>
								{(row) => (
									// biome-ignore lint/a11y/useFocusableInteractive lint/a11y/useKeyWithClickEvents: in the combobox pattern focus stays in the field, which handles the keys.
									<div
										id={optionId(row.index)}
										class='vds-palette__option'
										role='option'
										aria-selected={aria(row.index === active())}
										aria-disabled={aria(row.command.disabled)}
										onPointerMove={() => {
											if (!row.command.disabled) setActive(row.index)
										}}
										onClick={() => run(row.index)}
									>
										<Show when={row.command.icon}>
											{(name) => <Icon name={name()} />}
										</Show>
										<span class='vds-palette__label'>{row.command.label}</span>
										<Show when={row.command.hint}>
											<kbd class='vds-palette__hint'>{row.command.hint}</kbd>
										</Show>
									</div>
								)}
							</For>
						</div>
					)}
				</For>
			</div>
			<Show when={!results().length}>
				<p class='vds-palette__empty' role='status'>
					{props.emptyText ?? 'No matching commands'}
				</p>
			</Show>
		</div>
	)
}

/** The commands in group order, each group in the order its commands were given. */
export function grouped(commands: Command[]): Group[] {
	const groups = new Map<string | undefined, Group>()
	for (const command of commands) {
		const group = groups.get(command.group) ?? { name: command.group, rows: [] }
		groups.set(command.group, group)
		group.rows.push({ command, index: -1 })
	}
	let index = 0
	for (const group of groups.values()) for (const row of group.rows) row.index = index++
	return [...groups.values()]
}

/** The commands whose label or keywords contain every word of the query, ignoring case. */
export function matching(commands: Command[], query: string): Command[] {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean)
	if (!words.length) return commands
	return commands.filter((command) => {
		const text = [command.label, ...(command.keywords ?? [])].join(' ').toLowerCase()
		return words.every((word) => text.includes(word))
	})
}
