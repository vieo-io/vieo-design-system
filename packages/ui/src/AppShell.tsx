import { type JSX, Show } from '@solidjs/web'

export type AppShellProps = {
	/** The page: a toolbar, then whatever scrolls. */
	children: JSX.Element
	/**
	 * Draws the palette's `--wash` on one fixed backdrop behind the sidebar, the toolbar, and the page.
	 * Those go transparent over it, dialogs and toasts keep their colour, and the drawer draws the wash over `--raised`.
	 * Inside the shell, `--muted` becomes `--muted-on-wash`.
	 * Off when the person asks for more contrast or uses forced colours.
	 */
	gradient?: boolean
	/** Gets the `main` element, which can take focus, such as after a navigation from the drawer. */
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
		<div class={['vds-app-shell', { 'vds-app-shell--gradient': props.gradient }]}>
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
