import { test, expect } from '@playwright/test'

async function mockIfNeeded(page) {
  if ((process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('mock')) {
    await page.route('**/storage/v1/object/**', route => route.fulfill({ status: 200, body: '{}' }))
    await page.route('**/rest/v1/**', route => {
      const method = route.request().method()
      if (method === 'POST') return route.fulfill({ status: 201, body: JSON.stringify({ id: '1' }) })
      if (method === 'GET') return route.fulfill({ status: 200, body: '[]' })
      if (method === 'PATCH') return route.fulfill({ status: 204, body: '' })
      return route.continue()
    })
  }
}

test.describe('Validation & edge cases', () => {
  test('required fields on contact step', async ({ page }) => {
    await mockIfNeeded(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Choose Your Bike' }).click()
    await expect(page.getByText('Full name is required')).toBeVisible()
    await expect(page.getByText('Phone number is required')).toBeVisible()

    await page.getByLabel('Full Name').fill('A')
    await page.getByLabel('Phone Number').fill('123')
    await page.getByRole('button', { name: 'Choose Your Bike' }).click()
    await expect(page.getByText('Please enter a valid phone number')).toBeVisible()

    await page.getByLabel('Email Address').fill('invalid')
    // Blur to trigger validation and submit to render errors
    await page.getByLabel('Full Name').click()
    await page.getByRole('button', { name: 'Choose Your Bike' }).click()
    // Email validation is optional; only assert when email is provided and invalid
    // Some UIs only validate email on change + submit; allow optional
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })

  test('verification requires ID, waiver agree, and signature', async ({ page }) => {
    await mockIfNeeded(page)
    await page.goto('/')
    await page.getByLabel('Full Name').fill('Alex QA')
    await page.getByLabel('Phone Number').fill('(555) 111-2222')
    await page.getByRole('button', { name: 'Choose Your Bike' }).click()

    await page.getByRole('heading', { name: 'Aventon' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Continue should be disabled until all inputs provided
    const continueBtn = page.getByRole('button', { name: /^Continue$/ })
    await expect(continueBtn).toBeDisabled()

    // Waiver agree only is insufficient
    await page.getByRole('button', { name: 'Read Waiver' }).click()
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Accept & Close' }).click()
    await expect(continueBtn).toBeDisabled()
  })
})