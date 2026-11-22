import { Button, TextField, toast } from '@vieo-io/ui'
import { createSignal } from 'solid-js'

/** Pairing with Catch: a link out, a field for the address, and its check. */
export function ConnectForm(props: { onDone: () => void }) {
	const [address, setAddress] = createSignal('')
	const error = () =>
		address() && !address().startsWith('https://')
			? 'The address starts with https://'
			: undefined
	return (
		<div class='frame-form'>
			<p class='frame-muted'>
				Open Catch's pairing page and approve this machine. If the page can't reach this
				one, copy its address and paste it below.
			</p>
			<div class='frame-inline'>
				<Button size='sm' icon='open-page'>
					Open pairing page
				</Button>
				<Button size='sm' variant='ghost' icon='copy'>
					Copy link
				</Button>
			</div>
			<TextField
				label='Address of the pairing page'
				hint='It ends in a one-time code, and works for ten minutes.'
				placeholder='https://desk:7445/pair/…'
				value={address()}
				error={error()}
				onChange={setAddress}
			/>
			<div class='frame-foot'>
				<Button onClick={props.onDone}>Cancel</Button>
				<Button
					variant='primary'
					disabled={!address() || Boolean(error())}
					onClick={() => {
						props.onDone()
						toast('Vieo Catch connected', { kind: 'success' })
					}}
				>
					Connect
				</Button>
			</div>
		</div>
	)
}
