import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'
import { DESIGNS } from '@vieo-io/tokens'

/** Where the screenshots go. Each run overwrites the last. */
const SHOTS = process.env.GALLERY_SHOTS ?? join(import.meta.dirname, '..', 'shots')

/** Solid's dev build starts each diagnostic with its `[CODE]`. */
const DIAGNOSTIC = /^\[[A-Z][A-Z_]+\]/

/** WCAG 2.2 A and AA. axe's best-practice rules, such as every node sitting in a landmark, aren't held here. */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const SECTIONS = ['button', 'icon', 'tabs', 'listbox', 'palette', 'overlays']

for (const design of DESIGNS)
	for (const theme of ['light', 'dark'])
		test(`every component in ${design}, ${theme} renders with no Solid warning and no axe violation`, async ({
			page,
		}) => {
			const diagnostics: string[] = []
			page.on('console', (message) => {
				if (DIAGNOSTIC.test(message.text())) diagnostics.push(message.text())
			})
			const dir = join(SHOTS, `${design}-${theme}`)
			mkdirSync(dir, { recursive: true })
			await page.goto(`/?design=${design}&theme=${theme}`)
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
			await audit(page, 'page')

			for (const name of SECTIONS)
				await page
					.locator(`[data-component='${name}']`)
					.screenshot({ path: join(dir, `${name}.png`) })

			const overlays = page.locator("[data-component='overlays']")
			await overlays.evaluate((section) => section.scrollIntoView({ block: 'start' }))

			await page.getByRole('button', { name: 'Page actions' }).click()
			await expect(page.getByRole('menu')).toBeVisible()
			await audit(page, 'menu')
			await page.screenshot({ path: join(dir, 'menu.png') })
			await page.keyboard.press('Escape')

			await page.getByRole('button', { name: 'Share' }).click()
			await expect(page.getByRole('dialog', { name: 'Share' })).toBeVisible()
			await audit(page, 'popover')
			await page.screenshot({ path: join(dir, 'popover.png') })
			await page.keyboard.press('Escape')

			await page.getByRole('button', { name: 'Favourite' }).focus()
			await expect(page.getByRole('tooltip')).toBeVisible()
			await page.screenshot({ path: join(dir, 'tooltip.png') })
			await page.keyboard.press('Escape')

			await page.getByRole('button', { name: 'Open dialog' }).click()
			await expect(page.getByRole('dialog', { name: 'Delete this page?' })).toBeVisible()
			await audit(page, 'dialog')
			await page.screenshot({ path: join(dir, 'dialog.png') })
			await page.keyboard.press('Escape')
			await expect(page.getByRole('dialog')).toHaveCount(0)

			await page.getByRole('combobox', { name: 'Commands' }).fill('note')
			await page
				.locator("[data-component='palette']")
				.screenshot({ path: join(dir, 'palette-filtered.png') })

			expect.soft(diagnostics, 'Solid dev diagnostics').toEqual([])
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
