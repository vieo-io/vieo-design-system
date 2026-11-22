import { Icon, type TreeNode } from '@vieo-io/ui'

export const PAGES: TreeNode[] = [
	{
		id: 'notes',
		label: 'Notes',
		icon: 'folder',
		children: [
			{ id: 'direction', label: 'Design direction', icon: 'document' },
			{ id: 'plans', label: 'Plans', icon: 'document', end: '12' },
			{
				id: 'calls',
				label: 'Calls',
				icon: 'folder',
				children: [{ id: 'standup', label: 'Standup', icon: 'document' }],
			},
		],
	},
	{ id: 'tracker', label: 'Tracker', icon: 'tracker', end: '4' },
	{ id: 'transcripts', label: 'Transcripts', icon: 'mic' },
	{ id: 'settings', label: 'Settings', icon: 'settings' },
]

export const CHATS: TreeNode[] = [
	{
		id: 'provider-lanes',
		label: 'Fix the provider lanes test',
		meta: <Worktree name='llt-provider-lanes-test' />,
		end: <ChatEnd time='2m' agent='sparkle' />,
		unread: true,
	},
	{
		id: 'glow-and-rows',
		label: 'The gradient and the sidebar row',
		meta: <Worktree name='vieo-design-system-glow-and-rows' />,
		end: <ChatEnd time='1h' agent='code' />,
	},
	{
		id: 'drawer-clip',
		label: "Work out why the drawer clips the last row's actions on a phone",
		meta: <Worktree name='vieo-design-system' />,
		end: <ChatEnd time='Tue' agent='sparkle' />,
	},
]

function ChatEnd(props: { time: string; agent: 'code' | 'sparkle' }) {
	return (
		<>
			<span>{props.time}</span>
			<Icon name={props.agent} size='var(--icon-size-sm)' />
		</>
	)
}

function Worktree(props: { name: string }) {
	return (
		<>
			<Icon name='folder' size='var(--icon-size-sm)' />
			{props.name}
		</>
	)
}
