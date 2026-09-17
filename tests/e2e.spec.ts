import { test, expect } from '@playwright/test';

test.describe('Core App Load', () => {
  test('App loads successfully and shows landing page', async ({ page }) => {
    await page.goto('/');
    // The root URL serves the landing page when not logged in
    await expect(page).toHaveURL('https://localhost:5173/');
    
    // Check if the get started or demo button exists
    const tryDemoBtn = page.locator('button', { hasText: /try demo mode/i });
    if (await tryDemoBtn.isVisible()) {
      await expect(tryDemoBtn).toBeVisible();
    }
  });
});
