import { For, type JSX } from '@solidjs/web'
import { createUniqueId } from 'solid-js'
import { aria } from './aria'
import { moveFor, rows } from './roving'

export type Tab = { disabled?: boolean; label: string; value: string }

export type TabsProps = {
	/** The selected tab's panel. */
	children: JSX.Element
	/** Names the tab list for assistive technology. */
	label: string
	onChange: (value: string) => void
	tabs: Tab[]
	value: string
}

/** A row of tabs over one panel. Arrow keys, Home, and End move between tabs and select as they go. */
export function Tabs(props: TabsProps) {
	const id = createUniqueId()
	let list: HTMLDivElement | undefined
	const onKeyDown = (event: KeyboardEvent) => {
		const from = props.tabs.findIndex((tab) => tab.value === props.value)
		const move = moveFor(event.key, props.tabs, from, 'horizontal')
		const tab = move === undefined ? undefined : props.tabs[move]
		if (move === undefined || !tab) return
		event.preventDefault()
		rows(list, 'tab')[move]?.focus()
		props.onChange(tab.value)
	}
	return (
		<div class='vds-tabs'>
			<div
				ref={list}
				class='vds-tabs__list'
				role='tablist'
				aria-label={props.label}
				onKeyDown={onKeyDown}
			>
				<For each={props.tabs}>
					{(tab) => (
						<button
							type='button'
							id={`${id}-tab-${tab.value}`}
							class='vds-tabs__tab'
							role='tab'
							aria-selected={aria(tab.value === props.value)}
							aria-controls={`${id}-panel`}
							tabindex={tab.value === props.value ? '0' : '-1'}
							disabled={tab.disabled}
							onClick={() => props.onChange(tab.value)}
						>
							{tab.label}
						</button>
					)}
				</For>
			</div>
			<div
				id={`${id}-panel`}
				class='vds-tabs__panel'
				role='tabpanel'
				aria-labelledby={`${id}-tab-${props.value}`}
				tabindex='0'
			>
				{props.children}
			</div>
		</div>
	)
}
