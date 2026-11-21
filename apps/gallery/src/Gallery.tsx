import { For, type JSX } from '@solidjs/web'
import {
	Button,
	type Command,
	CommandPalette,
	Dialog,
	Icon,
	iconNames,
	Listbox,
	Menu,
	Popover,
	Tabs,
	Tooltip,
} from '@vieo-io/ui'
import { createSignal } from 'solid-js'
import { applyLook, lookFromUrl } from './look'
import { Toolbar } from './Toolbar'

const COMMANDS: Command[] = [
	{
		id: 'new',
		label: 'New note',
		group: 'Notes',
		icon: 'document-plus',
		hint: 'Ctrl N',
		onSelect: () => {},
	},
	{ id: 'open', label: 'Open recent', group: 'Notes', icon: 'document', onSelect: () => {} },
	{
		id: 'search',
		label: 'Search everything',
		group: 'Notes',
		icon: 'search',
		hint: 'Ctrl K',
		onSelect: () => {},
	},
	{
		id: 'theme',
		label: 'Switch theme',
		group: 'View',
		icon: 'eye',
		keywords: ['dark', 'light'],
		onSelect: () => {},
	},
	{
		id: 'sync',
		label: 'Sync now',
		group: 'View',
		icon: 'redo',
		disabled: true,
		onSelect: () => {},
	},
]

const OPTIONS = [
	{ value: 'inbox', label: 'Inbox', description: 'Notes nobody has filed yet' },
	{ value: 'projects', label: 'Projects' },
	{ value: 'archive', label: 'Archive', description: 'Read only', disabled: true },
	{ value: 'bin', label: 'Bin' },
]

const TABS = [
	{ value: 'overview', label: 'Overview' },
	{ value: 'history', label: 'History' },
	{ value: 'sharing', label: 'Sharing' },
	{ value: 'locked', label: 'Locked', disabled: true },
]

export function Gallery() {
	const [look, setLook] = createSignal(lookFromUrl())
	const [tab, setTab] = createSignal('overview')
	const [folder, setFolder] = createSignal('inbox')
	const [dialogOpen, setDialogOpen] = createSignal(false)
	const changeLook = (next: ReturnType<typeof lookFromUrl>) => {
		applyLook(next)
		setLook(next)
	}
	applyLook(lookFromUrl())
	return (
		<>
			<Toolbar look={look()} onChange={changeLook} />
			<main class='gallery'>
				<Section name='button' title='Button'>
					<div class='gallery-row'>
						<Button variant='primary'>Save</Button>
						<Button>Cancel</Button>
						<Button variant='ghost'>
							<Icon name='plus' />
							Add page
						</Button>
						<Button variant='danger'>Delete</Button>
						<Button disabled>Disabled</Button>
					</div>
					<div class='gallery-row'>
						<Button variant='primary' size='sm'>
							Save
						</Button>
						<Button size='sm'>Cancel</Button>
						<Button size='sm' variant='ghost'>
							<Icon name='more-horizontal' />
							More
						</Button>
					</div>
				</Section>
				<Section name='icon' title='Icon'>
					<ul class='gallery-icons'>
						<For each={iconNames()}>
							{(name) => (
								<li>
									<Icon name={name} />
									<span>{name}</span>
								</li>
							)}
						</For>
					</ul>
				</Section>
				<Section name='tabs' title='Tabs'>
					<Tabs label='Page details' tabs={TABS} value={tab()} onChange={setTab}>
						<p class='gallery-text'>The {tab()} panel.</p>
					</Tabs>
				</Section>
				<Section name='listbox' title='Listbox'>
					<div class='gallery-narrow'>
						<Listbox
							label='Folder'
							options={OPTIONS}
							value={folder()}
							onChange={setFolder}
						/>
					</div>
				</Section>
				<Section name='palette' title='Command palette'>
					<div class='gallery-narrow'>
						<CommandPalette
							label='Commands'
							placeholder='Type a command'
							commands={COMMANDS}
						/>
					</div>
				</Section>
				<Section name='overlays' title='Menu, popover, tooltip, and dialog'>
					<div class='gallery-row'>
						<Menu
							label='Page actions'
							items={[
								{ label: 'Rename', icon: 'write', onSelect: () => {} },
								{ label: 'Duplicate', icon: 'copy', onSelect: () => {} },
								{
									label: 'Move to archive',
									icon: 'archive',
									disabled: true,
									onSelect: () => {},
								},
								{
									label: 'Delete',
									icon: 'trash',
									danger: true,
									onSelect: () => {},
								},
							]}
							trigger={(trigger) => (
								<Button {...trigger}>
									Page actions
									<Icon name='chevron-down' />
								</Button>
							)}
						/>
						<Popover
							label='Share'
							trigger={(trigger) => <Button {...trigger}>Share</Button>}
						>
							<div class='gallery-popover'>
								<p class='gallery-text'>Anyone with the link can read this page.</p>
								<Button size='sm' variant='primary'>
									Copy link
								</Button>
							</div>
						</Popover>
						<Tooltip content='Add to favourites'>
							{(trigger) => (
								<Button {...trigger} variant='ghost' aria-label='Favourite'>
									<Icon name='star' />
								</Button>
							)}
						</Tooltip>
						<Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
					</div>
					<Dialog
						title='Delete this page?'
						description='It moves to the bin, where it stays for 30 days.'
						open={dialogOpen()}
						onOpenChange={setDialogOpen}
					>
						<div class='gallery-actions'>
							<Button onClick={() => setDialogOpen(false)}>Cancel</Button>
							<Button variant='danger' onClick={() => setDialogOpen(false)}>
								Delete
							</Button>
						</div>
					</Dialog>
				</Section>
			</main>
		</>
	)
}

function Section(props: { children: JSX.Element; name: string; title: string }) {
	return (
		<section
			class='gallery-section'
			data-component={props.name}
			aria-labelledby={`${props.name}-title`}
		>
			<h2 id={`${props.name}-title`}>{props.title}</h2>
			{props.children}
		</section>
	)
}
