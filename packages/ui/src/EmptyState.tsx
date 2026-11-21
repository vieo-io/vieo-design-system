import { type JSX, Show } from '@solidjs/web'
import { Icon, type IconName } from './Icon'

export type EmptyStateProps = {
	/** An action, such as a button that makes the first item. */
	children?: JSX.Element
	description?: string
	icon?: IconName
	title: string
}

/** What a list or page shows when it has nothing in it yet. */
export function EmptyState(props: EmptyStateProps) {
	return (
		<div class='vds-empty'>
			<Show when={props.icon}>
				{(name) => <Icon name={name()} class='vds-empty__icon' size='24px' />}
			</Show>
			<p class='vds-empty__title'>{props.title}</p>
			<Show when={props.description}>
				<p class='vds-empty__description'>{props.description}</p>
			</Show>
			<Show when={props.children}>
				<div class='vds-empty__actions'>{props.children}</div>
			</Show>
		</div>
	)
}
