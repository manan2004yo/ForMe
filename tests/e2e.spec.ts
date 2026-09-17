import { test, expect } from '@playwright/test';

test.describe('Hardcore E2E Stability Suite', () => {
  test('App handles full navigation lifecycle without crashing', async ({ page }) => {
    // 1. Catch any uncaught page errors
    const errors: Error[] = [];
    page.on('pageerror', (err) => {
      errors.push(err);
    });

    // 2. Load Landing Page
    await page.goto('/');
    await expect(page).toHaveURL('https://localhost:5173/');
    
    // 3. Login using Demo Mode
    const tryDemoBtn = page.locator('button', { hasText: /Explore with Demo Profile/i });
    await expect(tryDemoBtn).toBeVisible();
    await tryDemoBtn.click();
    
    // Wait for the app to navigate to the dashboard (root route when authenticated)
    await expect(page.locator('text=Hydration')).toBeVisible({ timeout: 10000 });

    // Ensure the Error Boundary didn't trigger
    const errorBoundaryMsg = page.locator('text=Something went wrong');
    await expect(errorBoundaryMsg).not.toBeVisible();

    // 4. Hardcore Route Testing - Click through every major route
    
    // Define the routes we want to test
    const routes = [
      { name: 'Eat', url: '/eat' },
      { name: 'Plan', url: '/plan' },
      { name: 'Train', url: '/train' },
      { name: 'Progress', url: '/progress' },
      { name: 'Profile', url: '/profile' }
    ];

    for (const route of routes) {
      await page.goto(route.url);
      
      // Wait for the page to stabilize without hanging on Firebase websockets
      await page.waitForTimeout(1500);

      // Verify the Error Boundary did NOT trigger
      await expect(errorBoundaryMsg).not.toBeVisible();
    }

    // 5. Assert absolutely ZERO unhandled console errors happened during navigation
    expect(errors.length).toBe(0);
  });
});
