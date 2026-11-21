import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { Tree, type TreeNode } from '../src/Tree'

const NODES: TreeNode[] = [
	{
		id: 'notes',
		label: 'Notes',
		children: [
			{ id: 'plans', label: 'Plans' },
			{
				id: 'calls',
				label: 'Calls',
				children: [{ id: 'standup', label: 'Standup' }],
			},
		],
	},
	{ id: 'tracker', label: 'Tracker' },
	{ id: 'transcripts', label: 'Transcripts' },
]

function renderTree(initial: string[] = []) {
	const [expanded, setExpanded] = createSignal(initial)
	const onOpen = vi.fn()
	render(() => (
		<Tree
			label='Pages'
			nodes={NODES}
			expanded={expanded()}
			onExpandedChange={(id, open) =>
				setExpanded((ids) => (open ? [...ids, id] : ids.filter((other) => other !== id)))
			}
			current='plans'
			onOpen={onOpen}
		/>
	))
	const item = (name: string) => screen.getByRole('treeitem', { name })
	const press = (key: string) => {
		fireEvent.keyDown(document.activeElement as Element, { key })
		flush()
	}
	return { expanded, item, onOpen, press }
}

describe('Tree', () => {
	it('up, down, right, and left move through rows and open and close folders', () => {
		const { expanded, item, press } = renderTree()
		item('Notes').focus()
		press('ArrowRight')
		expect(expanded(), 'right opens a closed folder').toEqual(['notes'])
		expect(document.activeElement).toBe(item('Notes'))
		press('ArrowRight')
		expect(document.activeElement, 'right on an open folder goes to its first child').toBe(
			item('Plans'),
		)
		press('ArrowDown')
		expect(document.activeElement).toBe(item('Calls'))
		press('ArrowDown')
		expect(document.activeElement, 'down skips the closed folder’s children').toBe(
			item('Tracker'),
		)
		press('ArrowUp')
		press('ArrowLeft')
		expect(document.activeElement, 'left on a closed child goes to its parent').toBe(
			item('Notes'),
		)
		press('ArrowLeft')
		expect(expanded(), 'left closes an open folder').toEqual([])
		press('End')
		expect(document.activeElement).toBe(item('Transcripts'))
		press('Home')
		expect(document.activeElement).toBe(item('Notes'))
	})

	it('the open page is aria-current and closed folders hide their children from the tree', () => {
		const { item } = renderTree(['notes'])
		expect(item('Plans').getAttribute('aria-current')).toBe('page')
		expect(item('Calls').getAttribute('aria-expanded')).toBe('false')
		expect(screen.queryByRole('treeitem', { name: 'Standup' })).toBeNull()
		expect(item('Notes').getAttribute('aria-expanded')).toBe('true')
		expect(item('Calls').getAttribute('aria-level')).toBe('2')
		expect(item('Tracker').hasAttribute('aria-expanded'), 'a leaf has no expanded state').toBe(
			false,
		)
		const stops = screen.getAllByRole('treeitem').filter((row) => row.tabIndex === 0)
		expect(stops, 'the open page is the one tab stop').toEqual([item('Plans')])
	})

	it('typing a letter moves to the next visible row starting with it', () => {
		const { item, onOpen, press } = renderTree(['notes'])
		item('Notes').focus()
		press('t')
		expect(document.activeElement).toBe(item('Tracker'))
		press('t')
		expect(document.activeElement).toBe(item('Transcripts'))
		press('c')
		expect(document.activeElement, 'wraps round to a row above').toBe(item('Calls'))
		press('s')
		expect(document.activeElement, 'Standup is inside a closed folder, so focus stays').toBe(
			item('Calls'),
		)
		press('Enter')
		expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'calls' }))
	})
})
