const { test, expect } = require('@playwright/test');

const result = id => `[data-trail="${id}"]`;

test('search and filters narrow the real path catalog', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#result-count')).toHaveText('30 of 30 paths');
  await page.getByRole('searchbox', { name: 'Find' }).fill('Clear Creek');
  await expect(page.locator('#result-count')).toHaveText('1 of 30 paths');
  await expect(page.locator(result('clear-creek-trail'))).toBeVisible();
  await page.getByRole('button', { name: 'With photos' }).click();
  await expect(page.locator('#result-count')).toHaveText('1 of 30 paths');
  await page.getByRole('button', { name: 'Clear all' }).click();
  await expect(page.locator('#result-count')).toHaveText('30 of 30 paths');
  await page.getByRole('button', { name: 'With photos' }).click();
  await expect(page.locator('#result-count')).toHaveText('8 of 30 paths');
});

test('selection opens a factual profile and keeps the map in sync', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#result-count')).toHaveText('30 of 30 paths');
  await page.locator(result('bear-creek-trail')).click();
  await expect(page).toHaveURL(/trail=bear-creek-trail/);
  await expect(page.locator('#selected-trail-title')).toHaveText('Bear Creek Trail');
  await expect(page.locator('#map-status')).toContainText('Bear Creek Trail');
  await expect(page.locator('#detail-panel')).toContainText('13');
  await expect(page.locator('#detail-panel img[alt*="Bear Creek Trail"]')).toHaveCount(2);
  await expect(page.locator('#detail-panel a[href*="creativecommons.org/licenses/by-sa/3.0"]')).toHaveCount(2);

  if (testInfo.project.name !== 'desktop') {
    await expect(page.locator('#selected-trail-title')).toBeInViewport();
    if (testInfo.project.name === 'phone') {
      await testInfo.attach('selected-path-phone', { body: await page.screenshot(), contentType: 'image/png' });
    }
    await page.getByRole('link', { name: 'View route map ↓' }).click();
    await expect(page.locator('#map')).toBeInViewport();
    await page.getByRole('link', { name: 'Back to results' }).click();
    await expect(page.locator('#results')).toBeInViewport();
  } else {
    await expect(page.getByRole('link', { name: 'Back to results' })).toBeHidden();
  }

});

test('small layouts do not overflow the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop');
  await page.goto('/');
  await expect(page.locator('#result-count')).toHaveText('30 of 30 paths');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('link', { name: 'View map ↓' })).toBeVisible();
});

test('outside the Front Range offers a useful Denver fallback', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });
  await page.goto('/');
  await expect(page.locator('#result-count')).toHaveText('30 of 30 paths');
  await page.getByRole('button', { name: 'Sort near my location' }).click();
  await expect(page.locator('#location-status')).toContainText('outside this demo’s Colorado Front Range coverage');
  await expect(page.locator('#result-count')).toHaveText('30 of 30 paths');
  await page.getByRole('button', { name: /Explore near Denver/ }).click();
  await expect(page.locator('#location-status')).toContainText('near Denver');
});
