import { type JSX, Show } from '@solidjs/web'

export type AppShellProps = {
	/** The page: a toolbar, then whatever scrolls. */
	children: JSX.Element
	/** Takes focus after navigation from a drawer, so give it to the `main` element's `ref`. */
	mainRef?: (element: HTMLElement) => void
	sidebar?: JSX.Element
	/** A strip along the bottom of the window. */
	statusBar?: JSX.Element
}

/**
 * The frame of an app window: the sidebar, the page, and an optional status bar. The page sits on `--surface`, set in
 * from the window by `--shell-inset` with `--shell-radius` corners in a design that insets it.
 */
export function AppShell(props: AppShellProps) {
	return (
		<div class='vds-app-shell'>
			{props.sidebar}
			<main ref={props.mainRef} class='vds-app-shell__main' tabindex='-1'>
				{props.children}
			</main>
			<Show when={props.statusBar}>
				<div class='vds-app-shell__status'>{props.statusBar}</div>
			</Show>
		</div>
	)
}
