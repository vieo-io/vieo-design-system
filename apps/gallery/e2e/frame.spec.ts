import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'
import { DESIGNS } from '@vieo-io/tokens'

const DIAGNOSTIC = /^\[[A-Z][A-Z_]+\]/

const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }

const SHOTS = process.env.GALLERY_SHOTS ?? join(import.meta.dirname, '..', 'shots')

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

for (const [width, device] of [
	['desktop', {}],
	['phone', PHONE],
] as const)
	test.describe(`the app frame on a ${width}`, () => {
		test.use(device)
		for (const design of DESIGNS)
			for (const theme of ['light', 'dark'])
				test(`renders with no Solid warning and no axe violation in ${design}, ${theme}`, async ({
					page,
				}) => {
					const diagnostics = watchDiagnostics(page)
					const dir = join(SHOTS, 'frame', `${width}-${design}-${theme}`)
					mkdirSync(dir, { recursive: true })
					// The toast comes from choosing System, which keeps the theme the journey is shot in.
					await page.emulateMedia({ colorScheme: theme as 'light' | 'dark' })
					await page.goto(`/?page=frame&design=${design}&theme=${theme}`)
					await expect(page.getByRole('heading', { level: 1 })).toHaveText(
						'Design direction',
					)
					await audit(page, 'note')
					await shoot(page, join(dir, 'note.png'))

					if (width === 'phone') {
						await page.getByRole('button', { name: 'Toggle the sidebar' }).click()
						await expect(page.getByRole('dialog', { name: 'Pages' })).toBeVisible()
						await audit(page, 'drawer')
						await shoot(page, join(dir, 'drawer.png'))
					}
					await page.getByRole('treeitem', { name: 'Settings' }).click()
					await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings')
					await expect(page.getByRole('dialog', { name: 'Pages' })).toHaveCount(0)
					await audit(page, 'settings')
					await shoot(page, join(dir, 'settings.png'))

					await page.getByRole('radio', { name: 'System' }).click()
					await expect(page.locator('.vds-toast--visible')).toHaveText(
						/Theme changed to System/,
					)
					await shoot(page, join(dir, 'toast.png'))
					// On a phone the toast lies over the lower settings rows.
					await page.getByRole('button', { name: 'Dismiss' }).click()
					await expect(page.locator('.vds-toast')).toHaveCount(0)

					await page.getByRole('button', { name: 'Connect' }).click()
					const dialog = page.getByRole('dialog', { name: 'Connect Vieo Catch' })
					await expect(dialog).toBeVisible()
					await dialog.getByRole('textbox').fill('http://desk')
					await dialog.getByRole('textbox').blur()
					await expect(
						dialog.getByText('The address must start with https://'),
					).toBeVisible()
					await audit(page, 'dialog')
					await shoot(page, join(dir, 'dialog.png'))

					await page.goto(`/?page=frame&design=${design}&theme=${theme}&gradient=on`)
					await expect(page.locator('.vds-app-shell--gradient')).toHaveCount(1)
					await audit(page, 'note with the gradient')
					await shoot(page, join(dir, 'note-gradient.png'))
					if (width === 'phone') {
						await page.getByRole('button', { name: 'Toggle the sidebar' }).click()
						await expect(page.getByRole('dialog', { name: 'Pages' })).toBeVisible()
						await audit(page, 'drawer with the gradient')
						await shoot(page, join(dir, 'drawer-gradient.png'))
					}

					expect.soft(diagnostics, 'Solid dev diagnostics').toEqual([])
				})
	})

test.describe('the gradient', () => {
	test('with the gradient on, one fixed backdrop paints the wash and the chrome over it is transparent', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&palette=lagoon&theme=light&gradient=on')
		const backdrop = await page
			.locator('.vds-app-shell')
			.evaluate((shell) => getComputedStyle(shell, '::before'))
		expect(backdrop.position).toBe('fixed')
		expect(backdrop.backgroundImage.match(/radial-gradient\(/g)).toHaveLength(3)
		for (const selector of ['.vds-sidebar', '.vds-toolbar', '.vds-app-shell__main'])
			expect.soft(await backgroundOf(page, selector), selector).toBe('rgba(0, 0, 0, 0)')

		const [muted, mutedOnWash] = await page.evaluate(() => [
			getComputedStyle(document.querySelector('.vds-app-shell') as Element)
				.getPropertyValue('--muted')
				.trim(),
			getComputedStyle(document.documentElement).getPropertyValue('--muted-on-wash').trim(),
		])
		expect(muted, 'muted text over the wash is drawn nearer the text colour').toBe(mutedOnWash)

		await page.getByRole('treeitem', { name: 'Settings' }).click()
		await page.getByRole('button', { name: 'Connect' }).click()
		expect(
			await backgroundOf(page, '.vds-dialog'),
			'a dialog floats on its own colour',
		).not.toBe('rgba(0, 0, 0, 0)')
	})

	for (const media of [{ contrast: 'more' }, { forcedColors: 'active' }] as const)
		test(`the gradient is off under ${Object.entries(media)[0]?.join(' ')}`, async ({
			page,
		}) => {
			await page.emulateMedia(media)
			await page.goto('/?page=frame&design=vieo&palette=lagoon&theme=light&gradient=on')
			const [content, muted, rootMuted] = await page
				.locator('.vds-app-shell')
				.evaluate((shell) => [
					getComputedStyle(shell, '::before').content,
					getComputedStyle(shell).getPropertyValue('--muted').trim(),
					getComputedStyle(document.documentElement).getPropertyValue('--muted').trim(),
				])
			expect(content).toBe('none')
			expect(muted, 'muted text keeps its own colour').toBe(rootMuted)
			expect(await backgroundOf(page, '.vds-app-shell__main')).not.toBe('rgba(0, 0, 0, 0)')
		})

	test('the backdrop is painted behind the sidebar, where the wash is strongest', async ({
		page,
	}) => {
		const corner = { x: 4, y: 120, width: 24, height: 24 }
		await page.goto('/?page=frame&design=vieo&palette=lagoon&theme=light&gradient=off')
		const plain = await page.screenshot({ clip: corner, animations: 'disabled' })
		await page.goto('/?page=frame&design=vieo&palette=lagoon&theme=light&gradient=on')
		const washed = await page.screenshot({ clip: corner, animations: 'disabled' })
		expect(washed.equals(plain)).toBe(false)
	})

	test('the Gradient switch turns the backdrop on and keeps it in the address', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&theme=light&open=settings')
		await expect(page.locator('.vds-app-shell--gradient')).toHaveCount(0)
		const toggle = page.getByRole('switch', { name: 'Gradient' })
		await toggle.click()
		await expect(page.locator('.vds-app-shell--gradient')).toHaveCount(1)
		expect(new URL(page.url()).searchParams.get('gradient')).toBe('on')
		await toggle.click()
		await expect(page.locator('.vds-app-shell--gradient')).toHaveCount(0)
		expect(new URL(page.url()).searchParams.get('gradient')).toBe('off')
	})

	for (const [theme, palette, selector] of [
		['light', 'paper', ':root'],
		['dark', 'paper', ":root[data-theme='dark']"],
		['light', 'lagoon', ":root[data-palette='lagoon']"],
	] as const)
		test(`an app's own glow under the package's selector wins, in ${palette}, ${theme}`, async ({
			page,
		}) => {
			await page.goto(`/?page=frame&palette=${palette}&theme=${theme}`)
			await page.addStyleTag({ content: `${selector} { --glow-1: #ff0000; }` })
			const glow = await page.evaluate(() =>
				getComputedStyle(document.documentElement).getPropertyValue('--glow-1').trim(),
			)
			expect(glow).toBe('#ff0000')
		})
})

test.describe('the chats tree', () => {
	test('a chat row lays its time over its agent icon at the end, and its worktree under the title', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&theme=light')
		const row = page.getByRole('treeitem', { name: /^The gradient and the sidebar row/ })
		const [time, icon] = await row.locator('.vds-tree__end > *').all()
		const timeBox = await time?.boundingBox()
		const iconBox = await icon?.boundingBox()
		expect(
			timeBox && iconBox && timeBox.y + timeBox.height <= iconBox.y,
			'time over icon',
		).toBe(true)
		expect(
			Math.abs(
				(timeBox?.x ?? 0) +
					(timeBox?.width ?? 0) -
					(iconBox?.x ?? 0) -
					(iconBox?.width ?? 0),
			),
			'end-aligned',
		).toBeLessThan(1)
		const label = await row.locator('.vds-tree__label').boundingBox()
		const meta = await row.locator('.vds-tree__meta').boundingBox()
		expect(label && meta && label.y + label.height <= meta.y, 'worktree under the title').toBe(
			true,
		)
	})

	test('a row with one line keeps the row height', async ({ page }) => {
		await page.goto('/?page=frame&design=vieo&theme=light')
		const height = await page
			.getByRole('treeitem', { name: 'Tracker 4' })
			.evaluate((row) => [
				row.getBoundingClientRect().height,
				Number.parseFloat(getComputedStyle(row).getPropertyValue('--row-height')),
			])
		expect(height[0]).toBe(height[1])
	})

	test('an unread chat sets its title and its time strong, the time in the text colour', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&theme=light')
		const row = page.getByRole('treeitem', {
			name: 'Fix the provider lanes test llt-provider-lanes-test 2m',
		})
		const [label, time, text, readLabel] = await row.evaluate((element) => {
			const style = (selector: string, within: ParentNode = element) =>
				getComputedStyle(within.querySelector(selector) as Element)
			const read = document.querySelector(
				'[role="tree"][aria-label="Chats"] [role="treeitem"]:not([data-unread])',
			) as Element
			return [
				style('.vds-tree__label').fontWeight,
				[style('.vds-tree__end > *').fontWeight, style('.vds-tree__end > *').color],
				getComputedStyle(element).color,
				style('.vds-tree__label', read).fontWeight,
			] as const
		})
		expect(label).toBe('600')
		expect(readLabel).toBe('400')
		expect(time).toEqual(['600', text])
	})
})

test('hovering a page row with actions swaps its count for the actions, and leaving brings it back', async ({
	page,
}) => {
	await page.goto('/?page=frame&design=vieo&theme=light')
	const row = page.getByRole('treeitem', { name: 'Tracker 4' })
	await row.hover()
	await expect(row.locator('.vds-tree__end')).toBeHidden()
	await expect(row.getByRole('button', { name: 'Page actions' })).toBeVisible()
	await page.mouse.move(800, 400)
	await expect(row.locator('.vds-tree__end')).toBeVisible()
})

test.describe('on a phone', () => {
	test.use(PHONE)

	test('with the gradient on, the drawer draws the wash fixed to the window over a solid colour', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&palette=clay&theme=dark&gradient=on')
		await page.getByRole('button', { name: 'Toggle the sidebar' }).click()
		const drawer = page.getByRole('dialog', { name: 'Pages' })
		await expect(drawer).toBeVisible()
		const style = await drawer.evaluate((element) => {
			const computed = getComputedStyle(element)
			return [
				computed.backgroundImage,
				computed.backgroundAttachment,
				computed.backgroundColor,
			]
		})
		expect(style[0]?.match(/radial-gradient\(/g)).toHaveLength(3)
		expect(style[1]).toContain('fixed')
		expect(style[2]).not.toBe('rgba(0, 0, 0, 0)')
	})

	test('a long chat title truncates before the end column, which keeps its width', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&theme=light')
		await page.getByRole('button', { name: 'Toggle the sidebar' }).click()
		const row = page
			.getByRole('dialog', { name: 'Pages' })
			.getByRole('treeitem', { name: /^Work out why the drawer/ })
		const [labelRight, endLeft, endFits, truncated] = await row.evaluate((element) => {
			const label = element.querySelector('.vds-tree__label') as HTMLElement
			const end = element.querySelector('.vds-tree__end') as HTMLElement
			return [
				label.getBoundingClientRect().right,
				end.getBoundingClientRect().left,
				end.scrollWidth <= end.clientWidth,
				label.scrollWidth > label.clientWidth,
			]
		})
		expect(truncated, 'the title is cut short').toBe(true)
		expect(labelRight).toBeLessThanOrEqual(Number(endLeft))
		expect(endFits, 'the end column keeps its width').toBe(true)
	})

	test('choosing a page in the drawer closes it and moves focus to the page', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&theme=light')
		const menu = page.getByRole('button', { name: 'Toggle the sidebar' })
		await menu.click()
		const drawer = page.getByRole('dialog', { name: 'Pages' })
		await drawer.getByRole('treeitem', { name: 'Plans' }).click()
		await expect(drawer).toHaveCount(0)
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plans')
		await expect(page.getByRole('main'), 'navigating moves focus to the page').toBeFocused()
	})

	test('on a coarse pointer a touch 21px from the centre of any control still reaches it, whatever it draws', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&theme=light&open=settings')
		expect
			.soft(
				await misses(
					page,
					'main :is(button, a[href], select, [role="radio"], [role="switch"])',
				),
			)
			.toEqual([])

		await page.getByRole('button', { name: 'Toggle the sidebar' }).click()
		await expect(page.getByRole('dialog', { name: 'Pages' })).toBeVisible()
		expect
			.soft(await misses(page, '[role="dialog"] :is([role="treeitem"], button)'))
			.toEqual([])
		await page.keyboard.press('Escape')

		await page.getByRole('button', { name: 'Connect' }).click()
		await expect(page.getByRole('dialog', { name: 'Connect Vieo Catch' })).toBeVisible()
		expect.soft(await misses(page, '.vds-dialog :is(button, input)')).toEqual([])
	})

	test('on a phone a labelled toolbar button shows only its icon, keeps its name, and gains a tooltip', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&theme=light')
		const share = page
			.getByRole('toolbar', { name: 'Page' })
			.getByRole('button', { name: 'Share' })
		const box = await share.boundingBox()
		expect(box?.width, 'the label has given way to the icon').toBe(box?.height)
		await share.focus()
		await expect(page.getByRole('tooltip')).toHaveText('Share')
	})
})

test('on a desktop a labelled toolbar button shows its label and no tooltip', async ({ page }) => {
	await page.goto('/?page=frame&design=vieo&theme=light')
	const share = page.getByRole('toolbar', { name: 'Page' }).getByRole('button', { name: 'Share' })
	await expect(share).toHaveText('Share')
	await share.focus()
	await expect(page.getByRole('tooltip')).toHaveCount(0)
})

async function audit(page: Page, state: string) {
	const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
	expect
		.soft(
			violations.flatMap((violation) =>
				violation.nodes.map(
					(node) =>
						`${state}: ${violation.id}: ${node.target.join(' ')}: ${node.any[0]?.message ?? ''}`,
				),
			),
			'axe violations',
		)
		.toEqual([])
}

/**
 * Each visible control matching `selector` that a touch 21px from its centre, up, down, left, or right, would miss.
 * Each is scrolled into view first.
 * A control drawn smaller passes when its hit area reaches that far.
 */
async function misses(page: Page, selector: string): Promise<string[]> {
	await page.waitForTimeout(200)
	return page.locator(selector).evaluateAll((controls) =>
		controls.flatMap((control) => {
			control.scrollIntoView({ block: 'center' })
			const box = control.getBoundingClientRect()
			if (box.width === 0 || box.height === 0) return []
			const [x, y] = [box.left + box.width / 2, box.top + box.height / 2]
			const missed = [
				[x, y - 21],
				[x, y + 21],
				[x - 21, y],
				[x + 21, y],
			].filter(([px, py]) => {
				const hit = document.elementFromPoint(px ?? 0, py ?? 0)
				return !hit || !(control.contains(hit) || control.closest('label')?.contains(hit))
			})
			const name = control.getAttribute('aria-label') ?? control.textContent?.trim()
			return missed.length === 0
				? []
				: [
						`${name || control.tagName}: drawn ${box.width}x${box.height}, ${missed.length} of 4 touches miss`,
					]
		}),
	)
}

async function backgroundOf(page: Page, selector: string): Promise<string> {
	return page
		.locator(selector)
		.first()
		.evaluate((element) => getComputedStyle(element).backgroundColor)
}

/** Shoots with transitions finished, so a toast that is fading in shows, and colours have settled. */
async function shoot(page: Page, path: string) {
	await page.screenshot({ path, animations: 'disabled' })
}

function watchDiagnostics(page: Page): string[] {
	const diagnostics: string[] = []
	page.on('console', (message) => {
		if (DIAGNOSTIC.test(message.text())) diagnostics.push(message.text())
	})
	return diagnostics
}
