import { test, expect } from '@playwright/test';

test.use({
  permissions: ['camera'],
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  }
});

test('Barcode scanner opens successfully with granted permissions', async ({ page }) => {
  // Inject auth state to bypass login
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('forme_auth', JSON.stringify({
      state: {
        user: { uid: 'test-user', email: 'test@example.com' },
        isInitialized: true,
        demoMode: true
      },
      version: 0
    }));
    localStorage.setItem('forme_user', JSON.stringify({
      state: {
        profile: { id: 'test-user', onboardingComplete: true },
        error: null
      },
      version: 0
    }));
  });

  // Go to Eat tab where scanner is
  await page.goto('http://localhost:5173/eat', { waitUntil: 'networkidle' });

  // Look for the scan button in the navbar/dashboard
  const scanBtn = page.getByRole('button').filter({ hasText: 'Scan' });
  await scanBtn.first().click();

  // Wait for the overlay to appear
  await page.waitForTimeout(1000);

  // The video element should be visible
  const video = page.locator('video');
  await expect(video).toBeVisible({ timeout: 5000 });

  // The "Camera Access Required" error should NOT be visible
  const errorText = page.locator('text="Camera Access Required"');
  await expect(errorText).toBeHidden();
});
