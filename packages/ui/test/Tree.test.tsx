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

function renderTree(initial: string[] = [], current = 'plans') {
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
			current={current}
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

	it('clicking a row opens it and makes it the tab stop', () => {
		const { item, onOpen } = renderTree()
		fireEvent.click(item('Tracker'))
		flush()
		expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'tracker' }))
		expect(item('Tracker').tabIndex).toBe(0)
	})

	it('the twisty opens a folder without opening its page', () => {
		const { expanded, item, onOpen } = renderTree()
		fireEvent.click(item('Notes').querySelector('.vds-tree__twisty') as Element)
		flush()
		expect(expanded()).toEqual(['notes'])
		expect(onOpen).not.toHaveBeenCalled()
	})

	it('Space opens the row, as Enter does', () => {
		const { item, onOpen, press } = renderTree()
		item('Notes').focus()
		press(' ')
		expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'notes' }))
	})

	it('a letter with Ctrl held is left to the browser', () => {
		const { item } = renderTree()
		item('Notes').focus()
		const event = fireEvent.keyDown(item('Notes'), { key: 't', ctrlKey: true })
		expect(document.activeElement).toBe(item('Notes'))
		expect(event, 'not cancelled').toBe(true)
	})

	it('when the current page is inside a closed folder, the first row is the tab stop', () => {
		renderTree([], 'standup')
		const stops = screen.getAllByRole('treeitem').filter((row) => row.tabIndex === 0)
		expect(stops.map((row) => row.textContent)).toEqual(['Notes'])
	})

	it('Right on a page does nothing', () => {
		const { expanded, item, press } = renderTree()
		item('Tracker').focus()
		press('ArrowRight')
		expect(expanded()).toEqual([])
		expect(document.activeElement).toBe(item('Tracker'))
	})

	it('a row with a count is named by its label and the count', () => {
		render(() => (
			<Tree
				label='Pages'
				nodes={[{ id: 'plans', label: 'Plans', end: '12' }]}
				expanded={[]}
				onExpandedChange={() => {}}
				onOpen={() => {}}
			/>
		))
		expect(screen.getByRole('treeitem', { name: 'Plans 12' }).textContent).toBe('Plans 12')
	})
})
