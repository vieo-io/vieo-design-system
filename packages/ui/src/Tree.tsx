import { For, type JSX, Show } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId } from 'solid-js'
import { aria } from './aria'
import { Icon, type IconName } from './Icon'
import { moveFor, typeahead } from './roving'

export type TreeNode = {
	children?: TreeNode[]
	/** At the row's end in muted text, such as a count. */
	end?: JSX.Element
	icon?: IconName
	id: string
	label: string
}

export type TreeProps = {
	/** Buttons that show at the row's end on hover and focus. */
	actions?: (node: TreeNode) => JSX.Element
	/** The id of the open page, marked `aria-current`. */
	current?: string
	expanded: readonly string[]
	/** Names the tree for assistive technology. */
	label: string
	nodes: TreeNode[]
	onExpandedChange: (id: string, open: boolean) => void
	/** A row was chosen, by click or by Enter. */
	onOpen: (node: TreeNode) => void
}

/** A visible row, in the order a person reads them. */
type Visible = { node: TreeNode; parent?: string }

/**
 * Navigation as a WAI-ARIA tree. Up and Down move through the visible rows, Right opens a folder or enters it, Left
 * closes one or goes to its parent, Home and End reach either end, and a letter moves to the next row starting with it.
 * A closed folder's children aren't rendered.
 */
export function Tree(props: TreeProps) {
	const id = createUniqueId()
	const [focused, setFocused] = createSignal<string>()
	const open = (node: TreeNode) =>
		Boolean(node.children?.length) && props.expanded.includes(node.id)
	const visible = createMemo(() => {
		const rows: Visible[] = []
		const walk = (nodes: TreeNode[], parent?: string) => {
			for (const node of nodes) {
				rows.push({ node, parent })
				if (open(node)) walk(node.children ?? [], node.id)
			}
		}
		walk(props.nodes)
		return rows
	})
	const stop = createMemo(() => {
		const ids = visible().map(({ node }) => node.id)
		return (
			[focused(), props.current].find((candidate) => candidate && ids.includes(candidate)) ??
			ids[0]
		)
	})
	const rowId = (node: string) => `${id}-${node}`
	const focus = (node: string) => {
		setFocused(node)
		document.getElementById(rowId(node))?.focus()
	}
	const onKeyDown = (event: KeyboardEvent) => {
		const rows = visible()
		const at = rows.findIndex(({ node }) => rowId(node.id) === (event.target as HTMLElement).id)
		const row = rows[at]
		if (!row) return
		const { node, parent } = row
		const handled = () => event.preventDefault()
		if (event.key === 'ArrowRight' && node.children?.length) {
			handled()
			if (!open(node)) props.onExpandedChange(node.id, true)
			else if (node.children[0]) focus(node.children[0].id)
			return
		}
		if (event.key === 'ArrowLeft') {
			handled()
			if (open(node)) props.onExpandedChange(node.id, false)
			else if (parent) focus(parent)
			return
		}
		if (event.key === 'Enter' || event.key === ' ') {
			handled()
			props.onOpen(node)
			return
		}
		const items = rows.map(({ node }) => ({ disabled: false, label: node.label }))
		const move =
			event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
				? typeahead(items, at, event.key)
				: moveFor(event.key, items, at)
		if (move === undefined || move < 0) return
		handled()
		const target = rows[move]
		if (target) focus(target.node.id)
	}
	/**
	 * A treeitem is the row alone, and owns its children's group through `aria-owns`, so its name and its
	 * visible text stay the row's own. A count joins the name after a space, which the text has too.
	 */
	const Row = (rowProps: { node: TreeNode; level: number }) => {
		const itemId = () => rowId(rowProps.node.id)
		const folder = () => Boolean(rowProps.node.children?.length)
		return (
			<>
				{/* biome-ignore lint/a11y/useFocusableInteractive: tabindex is set below, as the tree's roving tab stop. */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: the tree's own keydown handles Enter and the arrows. */}
				<div
					id={itemId()}
					class='vds-tree__item'
					role='treeitem'
					aria-labelledby={
						rowProps.node.end
							? `${itemId()}-label ${itemId()}-end`
							: `${itemId()}-label`
					}
					aria-level={rowProps.level}
					aria-expanded={folder() ? aria(open(rowProps.node)) : undefined}
					aria-owns={open(rowProps.node) ? `${itemId()}-group` : undefined}
					aria-current={rowProps.node.id === props.current ? 'page' : undefined}
					tabindex={stop() === rowProps.node.id ? '0' : '-1'}
					style={{ '--vds-tree-depth': rowProps.level - 1 }}
					onFocus={() => setFocused(rowProps.node.id)}
					onClick={() => {
						focus(rowProps.node.id)
						props.onOpen(rowProps.node)
					}}
				>
					<Show
						when={folder()}
						fallback={<span class='vds-tree__twisty' aria-hidden='true' />}
					>
						<span
							class='vds-tree__twisty'
							aria-hidden='true'
							onClick={(event) => {
								event.stopPropagation()
								props.onExpandedChange(rowProps.node.id, !open(rowProps.node))
							}}
						>
							<Icon
								name={open(rowProps.node) ? 'chevron-down' : 'chevron-right'}
								size='var(--icon-size-sm)'
							/>
						</span>
					</Show>
					<Show when={rowProps.node.icon}>
						{(name) => <Icon name={name()} class='vds-tree__icon' />}
					</Show>
					<span id={`${itemId()}-label`} class='vds-tree__label'>
						{rowProps.node.label}
					</span>
					<Show when={rowProps.node.end}>
						{' '}
						<span id={`${itemId()}-end`} class='vds-tree__end'>
							{rowProps.node.end}
						</span>
					</Show>
					<Show when={props.actions}>
						{(actions) => (
							<span class='vds-tree__actions'>{actions()(rowProps.node)}</span>
						)}
					</Show>
				</div>
				<Show when={open(rowProps.node)}>
					{/* biome-ignore lint/a11y/useSemanticElements: a tree's group is a role, and a fieldset would draw a form group. */}
					<div id={`${itemId()}-group`} class='vds-tree__group' role='group'>
						<For each={rowProps.node.children ?? []}>
							{(child) => <Row node={child} level={rowProps.level + 1} />}
						</For>
					</div>
				</Show>
			</>
		)
	}
	return (
		<div class='vds-tree' role='tree' aria-label={props.label} onKeyDown={onKeyDown}>
			<For each={props.nodes}>{(node) => <Row node={node} level={1} />}</For>
		</div>
	)
}
