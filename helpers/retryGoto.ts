import { Page } from '@playwright/test';

export async function retryGoto(
  page: Page,
  url: string,
  attempts = 3,
  timeout = 15000   // shorter individual timeout for faster retries
): Promise<void> {

  for (let i = 1; i <= attempts; i++) {
    try {
      console.log(`Attempt ${i}/${attempts} → Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
      console.log('Navigation successful');
      return; // SUCCESS — exit the function
    } catch (err) {
      console.log(`Navigation failed on attempt ${i}:`, err);

      if (i < attempts) {
        console.log('Retrying...');
        await page.waitForTimeout(1000); // small delay before retry
      } else {
        console.log('All navigation attempts failed.');
        throw err; // rethrow so Playwright marks test as failed
      }
    }
  }
}
