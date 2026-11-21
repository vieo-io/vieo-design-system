import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'
import { DESIGNS } from '@vieo-io/tokens'

const SHOTS = process.env.GALLERY_SHOTS ?? join(import.meta.dirname, '..', 'shots')

const DIAGNOSTIC = /^\[[A-Z][A-Z_]+\]/

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }

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
					await page.goto(`/?page=frame&design=${design}&theme=${theme}`)
					await expect(page.getByRole('heading', { level: 1 })).toHaveText(
						'Design direction',
					)
					await audit(page, 'note')
					await page.screenshot({ path: join(dir, 'note.png') })

					if (width === 'phone') {
						await page.getByRole('button', { name: 'Show the sidebar' }).click()
						await expect(page.getByRole('dialog', { name: 'Pages' })).toBeVisible()
						await audit(page, 'drawer')
						await page.screenshot({ path: join(dir, 'drawer.png') })
					}
					await page.getByRole('treeitem', { name: 'Settings' }).click()
					await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings')
					await expect(page.getByRole('dialog', { name: 'Pages' })).toHaveCount(0)
					await audit(page, 'settings')
					await page.screenshot({ path: join(dir, 'settings.png') })

					await page.getByRole('radio', { name: 'Dark' }).click()
					await expect(page.getByText('Theme changed to Dark')).toBeVisible()
					await page.screenshot({ path: join(dir, 'toast.png') })

					await page.getByRole('button', { name: 'Connect' }).click()
					const dialog = page.getByRole('dialog', { name: 'Connect Vieo Catch' })
					await expect(dialog).toBeVisible()
					await dialog.getByRole('textbox').fill('http://desk')
					await dialog.getByRole('textbox').blur()
					await expect(dialog.getByText('The address starts with https://')).toBeVisible()
					await audit(page, 'dialog')
					await page.screenshot({ path: join(dir, 'dialog.png') })

					expect.soft(diagnostics, 'Solid dev diagnostics').toEqual([])
				})
	})

test.describe('on a phone', () => {
	test.use(PHONE)

	test('the drawer opens from the menu button, a tree row navigates, and the drawer closes', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&theme=light')
		const menu = page.getByRole('button', { name: 'Show the sidebar' })
		await menu.click()
		const drawer = page.getByRole('dialog', { name: 'Pages' })
		await expect(drawer).toBeVisible()
		await page.keyboard.press('Escape')
		await expect(drawer).toHaveCount(0)
		await expect(menu, 'Escape gives focus back to the menu button').toBeFocused()

		await menu.click()
		await drawer.getByRole('treeitem', { name: 'Plans' }).click()
		await expect(drawer).toHaveCount(0)
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plans')
		await expect(page.getByRole('main'), 'navigating moves focus to the page').toBeFocused()
	})

	test('on a coarse pointer every button has a 44px hit area whatever its visible height', async ({
		page,
	}) => {
		await page.goto('/?page=frame&design=vieo&theme=light')
		await page.getByRole('button', { name: 'Show the sidebar' }).click()
		await page.getByRole('treeitem', { name: 'Settings' }).click()
		await page.getByRole('button', { name: 'Connect' }).click()
		const small = await page.locator('.vds-button:visible').evaluateAll((buttons) =>
			buttons.flatMap((button) => {
				const box = button.getBoundingClientRect()
				const hit = getComputedStyle(button, '::before')
				const [width, height] = [hit.width, hit.height].map((value) =>
					Number.parseFloat(value),
				)
				const name = button.getAttribute('aria-label') ?? button.textContent?.trim()
				return (width ?? 0) >= 44 && (height ?? 0) >= 44
					? []
					: [`${name}: drawn ${box.width}x${box.height}, hits ${width}x${height}`]
			}),
		)
		expect(small).toEqual([])
	})

	test('a labelled toolbar button keeps its name and gains a tooltip once the toolbar narrows', async ({
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
	const more = page.getByRole('button', { name: 'More', exact: true })
	await more.focus()
	await expect(page.getByRole('tooltip'), 'an icon-only button names itself').toHaveText('More')
})

function watchDiagnostics(page: Page): string[] {
	const diagnostics: string[] = []
	page.on('console', (message) => {
		if (DIAGNOSTIC.test(message.text())) diagnostics.push(message.text())
	})
	return diagnostics
}

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
