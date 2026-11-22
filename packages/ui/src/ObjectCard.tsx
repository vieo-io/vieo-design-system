import { Show } from '@solidjs/web'
import { createUniqueId } from 'solid-js'
import { AppMark } from './AppSwitcher'
import type { IconName } from './Icon'

export type ObjectCardData = {
	/** The owning app's colour, behind the icon. */
	colour: string
	href: string
	icon: IconName
	status?: string
	summary?: string
	title: string
	/** The kind of object in the owning app's words, such as "Tracker issue". */
	type: string
	version: number
}

export type ObjectCardProps = {
	card: ObjectCardData
	/** Opens the object in its app. Without it, Open follows the card's link. */
	onOpen?: (card: ObjectCardData) => void
}

const KNOWN_VERSIONS = [1]

/**
 * Another app's object drawn in this one: its icon, type, status, title, a summary line, and an Open
 * action. A card from a schema version it doesn't know is shown as a plain link to the object.
 */
export function ObjectCard(props: ObjectCardProps) {
	const id = createUniqueId()
	const open = (event: MouseEvent) => {
		if (!props.onOpen || event.ctrlKey || event.metaKey || event.shiftKey) return
		event.preventDefault()
		props.onOpen(props.card)
	}
	return (
		<Show
			when={KNOWN_VERSIONS.includes(props.card.version)}
			fallback={
				<a class='vds-object-link' href={props.card.href}>
					{props.card.title}
				</a>
			}
		>
			<article class='vds-object-card' aria-labelledby={`${id}-title`}>
				<AppMark app={props.card} size='lg' />
				<div class='vds-object-card__lines'>
					<span class='vds-object-card__what'>
						{props.card.type}
						<Show when={props.card.status}>
							<span class='vds-object-card__status'>{props.card.status}</span>
						</Show>
					</span>
					<span id={`${id}-title`} class='vds-object-card__title'>
						{props.card.title}
					</span>
					<Show when={props.card.summary}>
						<span class='vds-object-card__summary'>{props.card.summary}</span>
					</Show>
				</div>
				<a
					class='vds-button vds-button--ghost vds-button--sm'
					href={props.card.href}
					aria-label={`Open ${props.card.title}`}
					onClick={open}
				>
					Open
				</a>
			</article>
		</Show>
	)
}
