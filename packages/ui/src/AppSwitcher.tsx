import { Show } from '@solidjs/web'
import { Icon, type IconName } from './Icon'
import { Menu } from './Menu'

export type App = {
	/** The app's colour, behind its mark. */
	colour: string
	/** A line under the name, such as where an app lives for now. */
	description?: string
	icon: IconName
	id: string
	name: string
}

export type AppSwitcherProps = {
	apps: App[]
	/** The id of the app this is. */
	current: string
	onOpen: (app: App) => void
}

/** An app's icon on its colour. */
export function AppMark(props: { app: Pick<App, 'colour' | 'icon'>; size?: 'md' | 'lg' }) {
	return (
		<span
			class={['vds-app-mark', { 'vds-app-mark--lg': props.size === 'lg' }]}
			style={{ '--vds-app': props.app.colour }}
		>
			<Icon name={props.app.icon} />
		</span>
	)
}

/** The open app's mark and name, opening a menu of the host's apps. */
export function AppSwitcher(props: AppSwitcherProps) {
	const current = () => props.apps.find((app) => app.id === props.current)
	return (
		<Menu
			label='Apps'
			class='vds-app-switcher__menu'
			items={props.apps.map((app) => ({
				current: app.id === props.current,
				description: app.description,
				label: app.name,
				leading: () => <AppMark app={app} />,
				onSelect: () => props.onOpen(app),
			}))}
			trigger={(trigger) => (
				<button type='button' class='vds-app-switcher' {...trigger}>
					<Show when={current()}>{(app) => <AppMark app={app()} />}</Show>
					<span class='vds-app-switcher__name'>{current()?.name}</span>
					<Icon name='chevron-down' size='var(--icon-size-sm)' />
				</button>
			)}
		/>
	)
}
