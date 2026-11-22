import { Switch as Choose, For, Match } from '@solidjs/web'
import { DESIGNS, PALETTES } from '@vieo-io/tokens'
import {
	type App,
	AppShell,
	AppSwitcher,
	Badge,
	Button,
	Dialog,
	EmptyState,
	IconButton,
	Kbd,
	ObjectCard,
	type ObjectCardData,
	SegmentedControl,
	Select,
	SettingRow,
	Sidebar,
	Switch,
	Toaster,
	Toolbar,
	Tree,
	type TreeNode,
	toast,
} from '@vieo-io/ui'
import { createSignal } from 'solid-js'
import { ConnectForm } from './ConnectForm'
import { applyLook, label, lookFromUrl } from './look'
import { CHATS, PAGES } from './sidebar'

const APPS: App[] = [
	{ id: 'vieo', name: 'Vieo', icon: 'home', colour: '#4f5bd5' },
	{ id: 'base', name: 'Vieo Base', icon: 'document', colour: '#2f6fde' },
	{ id: 'catch', name: 'Vieo Catch', icon: 'mic', colour: '#1f8a6a' },
	{ id: 'dev', name: 'Vieo Dev', icon: 'code', colour: '#8a4fd0' },
	{
		id: 'tracker',
		name: 'Vieo Tracker',
		icon: 'tracker',
		colour: '#c8611c',
		description: 'In Base for now',
	},
]

const CARDS: ObjectCardData[] = [
	{
		version: 1,
		type: 'Tracker issue',
		title: 'Shorter buttons across the apps',
		status: 'In progress',
		summary: 'Controls at 32px, with labels that give way to icons when a bar narrows.',
		icon: 'tracker',
		colour: '#c8611c',
		href: '#tracker',
	},
	{
		version: 1,
		type: 'Catch transcript',
		title: 'Design review, 21 November',
		summary: 'Alex and Sam, 24 minutes.',
		icon: 'mic',
		colour: '#1f8a6a',
		href: '#transcripts',
	},
]

const THEMES = ['system', 'light', 'dark']

export function AppFrame() {
	const [look, setLook] = createSignal(lookFromUrl())
	applyLook(lookFromUrl())
	const [page, setPage] = createSignal(
		new URL(location.href).searchParams.get('open') ?? 'direction',
	)
	const [expanded, setExpanded] = createSignal(['notes'])
	const [width, setWidth] = createSignal(256)
	const [collapsed, setCollapsed] = createSignal(false)
	const [drawer, setDrawer] = createSignal(false)
	const [connecting, setConnecting] = createSignal(false)
	const [serif, setSerif] = createSignal(false)
	const [compact, setCompact] = createSignal(true)
	const [gradient, setGradient] = createSignal(
		new URL(location.href).searchParams.get('gradient') === 'on',
	)
	const changeGradient = (on: boolean) => {
		setGradient(on)
		const url = new URL(location.href)
		url.searchParams.set('gradient', on ? 'on' : 'off')
		history.replaceState(null, '', url)
	}
	let main: HTMLElement | undefined
	let navigated = false
	const title = () => findPage([...PAGES, ...CHATS], page())?.label ?? ''
	const changeLook = (key: 'design' | 'palette' | 'theme', value: string) => {
		const before = look()
		const next = { ...before, [key]: value }
		setLook(next)
		applyLook(next)
		toast(`${label(key)} changed to ${label(value)}`, {
			key: 'look',
			kind: 'success',
			action: {
				label: 'Undo',
				onAction: () => {
					setLook(before)
					applyLook(before)
				},
			},
		})
	}
	const open = (node: TreeNode) => {
		setPage(node.id)
		navigated = true
		setDrawer(false)
	}
	return (
		<>
			<AppShell
				gradient={gradient()}
				mainRef={(element) => {
					main = element
				}}
				sidebar={
					<Sidebar
						label='Pages'
						width={width()}
						collapsed={collapsed()}
						onWidthChange={setWidth}
						onCollapsedChange={setCollapsed}
						drawerOpen={drawer()}
						onDrawerOpenChange={(next) => {
							if (next) navigated = false
							setDrawer(next)
						}}
						drawerFocusAfter={() => (navigated ? main : undefined)}
						footer={<AppSwitcher apps={APPS} current='base' onOpen={() => {}} />}
					>
						<Tree
							label='Pages'
							nodes={PAGES}
							expanded={expanded()}
							onExpandedChange={(id, isOpen) =>
								setExpanded((ids) =>
									isOpen ? [...ids, id] : ids.filter((other) => other !== id),
								)
							}
							current={page()}
							onOpen={open}
							actions={() => (
								<IconButton
									icon='more-horizontal'
									label='Page actions'
									variant='ghost'
									size='sm'
									tabindex='-1'
								/>
							)}
						/>
						<div class='frame-sidebar-head'>Chats</div>
						<Tree
							label='Chats'
							nodes={CHATS}
							expanded={[]}
							onExpandedChange={() => {}}
							current={page()}
							onOpen={open}
						/>
					</Sidebar>
				}
			>
				<Toolbar
					label='Page'
					title={title()}
					subtitle={findPage(PAGES, page())?.icon === 'document' ? 'Note' : undefined}
					leading={
						<IconButton
							icon='menu'
							label='Toggle the sidebar'
							variant='ghost'
							onClick={() => {
								if (matchMedia('(max-width: 639.98px)').matches) setDrawer(true)
								else setCollapsed(!collapsed())
							}}
						/>
					}
				>
					<IconButton icon='share' label='Share' showLabel variant='ghost' />
					<IconButton icon='pin' label='Pin' showLabel variant='ghost' />
					<IconButton icon='more-horizontal' label='More' variant='ghost' />
				</Toolbar>
				<div class='frame-scroll'>
					<Choose>
						<Match when={page() === 'settings'}>
							<div class='frame-page frame-settings'>
								<h2>Look</h2>
								<SettingRow label='Theme' hint='Follow the system, or pick one.'>
									{(ids) => (
										<SegmentedControl
											label='Theme'
											value={look().theme}
											options={THEMES.map((value) => ({
												value,
												label: label(value),
											}))}
											onChange={(value) => changeLook('theme', value)}
											{...ids}
										/>
									)}
								</SettingRow>
								<SettingRow
									label='Design'
									hint='Spacing, corners, and control sizes.'
								>
									{(ids) => (
										<Select
											value={look().design}
											options={DESIGNS.map((value) => ({
												value,
												label: label(value),
											}))}
											onChange={(value) => changeLook('design', value)}
											{...ids}
										/>
									)}
								</SettingRow>
								<SettingRow
									label='Palette'
									hint='Colours only. Any palette goes with any design.'
								>
									{(ids) => (
										<Select
											value={look().palette}
											options={PALETTES.map((value) => ({
												value,
												label: label(value),
											}))}
											onChange={(value) => changeLook('palette', value)}
											{...ids}
										/>
									)}
								</SettingRow>
								<SettingRow
									label='Gradient'
									hint="A wash of the palette's colours behind the sidebar and the page."
								>
									{(ids) => (
										<Switch
											checked={gradient()}
											onChange={changeGradient}
											{...ids}
										/>
									)}
								</SettingRow>
								<h2>Reading</h2>
								<SettingRow
									label='Serif for long text'
									hint='Notes and transcripts in a serif. The interface keeps its own font.'
								>
									{(ids) => (
										<Switch checked={serif()} onChange={setSerif} {...ids} />
									)}
								</SettingRow>
								<SettingRow
									label='Compact sidebar'
									hint='One line per page, without the count.'
								>
									{(ids) => (
										<Switch
											checked={compact()}
											onChange={setCompact}
											{...ids}
										/>
									)}
								</SettingRow>
								<h2>Connected apps</h2>
								<SettingRow label='Vieo Catch' hint='Not connected'>
									{(ids) => (
										<Button
											size='sm'
											icon='link'
											onClick={() => setConnecting(true)}
											aria-describedby={ids['aria-describedby']}
										>
											Connect
										</Button>
									)}
								</SettingRow>
							</div>
						</Match>
						<Match when={page() === 'transcripts'}>
							<EmptyState
								icon='mic'
								title='No transcripts yet'
								description='Start a session in Vieo Catch and it saves here.'
							>
								<Button variant='primary' icon='plus'>
									New session
								</Button>
							</EmptyState>
						</Match>
						<Match when={true}>
							<article class='frame-page frame-note'>
								<p>
									The direction is settled: the inset shell, 32px controls, and
									Inter. <Badge tone='success'>Approved</Badge>
								</p>
								<For each={CARDS}>{(card) => <ObjectCard card={card} />}</For>
								<p>
									Press <Kbd keys='Mod+B' /> to hide the sidebar.
								</p>
							</article>
						</Match>
					</Choose>
				</div>
			</AppShell>
			<Dialog title='Connect Vieo Catch' open={connecting()} onOpenChange={setConnecting}>
				<ConnectForm onDone={() => setConnecting(false)} />
			</Dialog>
			<Toaster />
		</>
	)
}

function findPage(nodes: TreeNode[], id: string): TreeNode | undefined {
	for (const node of nodes) {
		if (node.id === id) return node
		const found = findPage(node.children ?? [], id)
		if (found) return found
	}
	return undefined
}
