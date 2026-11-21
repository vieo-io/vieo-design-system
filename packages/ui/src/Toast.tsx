import { createPresence } from '@solid-primitives/presence'
import { For, Show } from '@solidjs/web'
import { createEffect, createStore, onSettled } from 'solid-js'
import { Button } from './Button'
import { Icon } from './Icon'

export type ToastKind = 'info' | 'success' | 'error'

export type ToastOptions = {
	action?: { label: string; onAction: () => void }
	/** Milliseconds before it goes. Defaults to 4 seconds, or 8 with an action. */
	duration?: number
	/** A toast with the same key replaces the one already showing. */
	key?: string
	kind?: ToastKind
	/** Stays until it's dismissed or its action runs. */
	pinned?: boolean
}

type Entry = ToastOptions & { id: number; leaving: boolean; message: string }

const ACTION_DURATION_MS = 8000

const DEFAULT_DURATION_MS = 4000

/** How long a toast takes to fade out, and so how long it stays in the list after it's dismissed. */
const EXIT_MS = 160

const ICONS = { info: 'info', success: 'check', error: 'info' } as const

const [toasts, setToasts] = createStore<{ list: Entry[] }>({ list: [] })

let nextId = 1

/** Removes a toast, fading it out first. */
export function dismissToast(id: number): void {
	setToasts((state) => {
		const entry = state.list.find((item) => item.id === id)
		if (entry) entry.leaving = true
	})
	setTimeout(() => {
		setToasts((state) => {
			state.list = state.list.filter((item) => item.id !== id)
		})
	}, EXIT_MS)
}

/** Shows a message in the Toaster and returns its id. It never takes focus. */
export function toast(message: string, options: ToastOptions = {}): number {
	const id = nextId++
	setToasts((state) => {
		const kept = options.key
			? state.list.filter((item) => item.key !== options.key)
			: state.list
		state.list = [...kept, { ...options, id, leaving: false, message }]
	})
	return id
}

/**
 * Where toasts appear: a polite live region in the corner, newest last. Mount one near the root.
 * Hovering or focusing a toast pauses its timer.
 */
export function Toaster() {
	onSettled(
		() => () =>
			setToasts((state) => {
				state.list = []
			}),
	)
	return (
		<section class='vds-toaster' aria-label='Notifications' aria-live='polite'>
			<For each={toasts.list}>{(entry) => <ToastItem entry={entry} />}</For>
		</section>
	)
}

function ToastItem(props: { entry: Entry }) {
	const presence = createPresence(() => (props.entry.leaving ? undefined : props.entry), {
		transitionDuration: EXIT_MS,
		initialEnter: true,
	})
	let remaining = 0
	let startedAt = 0
	let timer: ReturnType<typeof setTimeout> | undefined
	const start = (id: number) => {
		clearTimeout(timer)
		startedAt = Date.now()
		timer = setTimeout(() => dismissToast(id), remaining)
	}
	const resume = () => {
		if (!props.entry.pinned && !props.entry.leaving) start(props.entry.id)
	}
	const pause = () => {
		if (timer === undefined) return
		clearTimeout(timer)
		timer = undefined
		remaining -= Date.now() - startedAt
	}
	createEffect(
		() => ({
			id: props.entry.id,
			duration:
				props.entry.duration ??
				(props.entry.action ? ACTION_DURATION_MS : DEFAULT_DURATION_MS),
			timed: !props.entry.pinned && !props.entry.leaving,
		}),
		({ id, duration, timed }) => {
			remaining = duration
			if (timed) start(id)
			return () => clearTimeout(timer)
		},
	)
	return (
		<Show when={presence.isMounted()}>
			<div
				class={[
					'vds-toast',
					`vds-toast--${props.entry.kind ?? 'info'}`,
					{ 'vds-toast--visible': presence.isVisible() },
				]}
				onPointerEnter={pause}
				onPointerLeave={resume}
				onFocusIn={pause}
				onFocusOut={resume}
			>
				<Show when={props.entry.kind && props.entry.kind !== 'info'}>
					<Icon name={ICONS[props.entry.kind ?? 'info']} class='vds-toast__icon' />
				</Show>
				<span class='vds-toast__message'>{props.entry.message}</span>
				<Show when={props.entry.action}>
					{(action) => (
						<Button
							variant='ghost'
							size='sm'
							onClick={() => {
								action().onAction()
								dismissToast(props.entry.id)
							}}
						>
							{action().label}
						</Button>
					)}
				</Show>
				<Button
					variant='ghost'
					size='sm'
					class='vds-toast__dismiss'
					aria-label='Dismiss'
					onClick={() => dismissToast(props.entry.id)}
				>
					<Icon name='close' size='var(--icon-size-sm)' />
				</Button>
			</div>
		</Show>
	)
}
