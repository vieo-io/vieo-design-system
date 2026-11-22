import { createFocusTrap } from '@solid-primitives/focus'
import { createPresence } from '@solid-primitives/presence'
import { type JSX, Show } from '@solidjs/web'
import { createEffect, createSignal, onSettled } from 'solid-js'
import { isTopDialog, pushDialog } from './layers'
import { Resizer } from './Resizer'

export type SidebarProps = {
	/** The width in pixels below which the sidebar becomes a drawer over the page. */
	breakpoint?: number
	children: JSX.Element
	collapsed: boolean
	/** Where focus goes as the drawer closes, such as the page after a navigation. Unset, it goes back to whatever opened the drawer. */
	drawerFocusAfter?: () => HTMLElement | undefined
	/** Whether the drawer is open, below the breakpoint. Close it after the person navigates. */
	drawerOpen: boolean
	/** Below the rows, such as an app switcher or an account button. */
	footer?: JSX.Element
	/** Names the navigation for assistive technology. */
	label: string
	maxWidth?: number
	minWidth?: number
	onCollapsedChange: (collapsed: boolean) => void
	onDrawerOpenChange: (open: boolean) => void
	onWidthChange: (width: number) => void
	/** The width a double-click on the handle goes back to. */
	resetWidth?: number
	width: number
}

const BREAKPOINT = 640

/** How long the drawer takes to slide in or out, matching `--vds-drawer-duration`. */
const DRAWER_MS = 160

const WIDTH = { min: 220, max: 480, reset: 256 }

/**
 * The app's navigation. On a wide window it sits beside the page with a handle to resize it, and Mod-B hides it.
 * Below the breakpoint it is a modal drawer that slides over the page. The app keeps the width, the collapsed state,
 * and whether the drawer is open, and stores them however it likes.
 */
export function Sidebar(props: SidebarProps) {
	const narrow = createNarrow(() => props.breakpoint ?? BREAKPOINT)
	const drawer = createPresence(() => (narrow() && props.drawerOpen) || undefined, {
		transitionDuration: DRAWER_MS,
	})
	const [panel, setPanel] = createSignal<HTMLElement>()
	const self = {}
	createFocusTrap({
		element: panel,
		enabled: () => narrow() && props.drawerOpen,
		finalFocusElement: () => props.drawerFocusAfter?.(),
	})
	// Escape is heard on the document, since focus reaches the drawer two frames after it opens.
	createEffect(
		() => narrow() && props.drawerOpen,
		(open) => {
			if (!open) return
			const pop = pushDialog(self)
			const onKeyDown = (event: KeyboardEvent) => {
				if (event.key !== 'Escape' || event.defaultPrevented || !isTopDialog(self)) return
				event.preventDefault()
				props.onDrawerOpenChange(false)
			}
			document.addEventListener('keydown', onKeyDown)
			return () => {
				pop()
				document.removeEventListener('keydown', onKeyDown)
			}
		},
	)
	onSettled(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (
				event.key.toLowerCase() !== 'b' ||
				!(event.metaKey || event.ctrlKey) ||
				event.altKey ||
				event.shiftKey ||
				editable(event.target)
			)
				return
			event.preventDefault()
			if (narrow()) props.onDrawerOpenChange(!props.drawerOpen)
			else props.onCollapsedChange(!props.collapsed)
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	})
	const body = () => (
		<>
			<div class='vds-sidebar__scroll'>{props.children}</div>
			<Show when={props.footer}>
				<div class='vds-sidebar__footer'>{props.footer}</div>
			</Show>
		</>
	)
	return (
		<Show
			when={narrow()}
			fallback={
				<Show when={!props.collapsed}>
					<div class='vds-sidebar-frame' style={{ width: `${props.width}px` }}>
						<nav class='vds-sidebar' aria-label={props.label}>
							{body()}
						</nav>
						<Resizer
							label={`Resize ${props.label}`}
							value={props.width}
							min={props.minWidth ?? WIDTH.min}
							max={props.maxWidth ?? WIDTH.max}
							reset={props.resetWidth ?? WIDTH.reset}
							onChange={props.onWidthChange}
						/>
					</div>
				</Show>
			}
		>
			<Show when={drawer.isMounted()}>
				<div
					class={['vds-drawer-scrim', { 'vds-drawer--visible': drawer.isVisible() }]}
					onPointerDown={() => props.onDrawerOpenChange(false)}
				/>
				<div
					ref={setPanel}
					class={[
						'vds-sidebar',
						'vds-drawer',
						{ 'vds-drawer--visible': drawer.isVisible() },
					]}
					role='dialog'
					aria-modal='true'
					aria-label={props.label}
					tabindex='-1'
				>
					<nav class='vds-drawer__nav' aria-label={props.label}>
						{body()}
					</nav>
				</div>
			</Show>
		</Show>
	)
}

/** Whether the window is narrower than `breakpoint()`, following it as the window resizes. */
function createNarrow(breakpoint: () => number): () => boolean {
	const [narrow, setNarrow] = createSignal(false)
	createEffect(breakpoint, (width) => {
		const query = window.matchMedia(`(max-width: ${width - 0.02}px)`)
		const update = () => setNarrow(query.matches)
		update()
		query.addEventListener('change', update)
		return () => query.removeEventListener('change', update)
	})
	return narrow
}

/** A text field or rich-text editor, where Mod-B belongs to the text. */
function editable(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable || target.matches('input, textarea, select'))
	)
}
