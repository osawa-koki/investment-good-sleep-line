import { test } from '@playwright/test'

test('can access index page', async ({ page }) => {
  await page.goto('/')
})
