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

					expect.soft(diagnostics, 'Solid dev diagnostics').toEqual([])
				})
	})

test.describe('on a phone', () => {
	test.use(PHONE)

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
 * A control drawn smaller passes when its hit area reaches that far.
 */
async function misses(page: Page, selector: string): Promise<string[]> {
	await page.waitForTimeout(200)
	return page.locator(selector).evaluateAll((controls) =>
		controls.flatMap((control) => {
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
