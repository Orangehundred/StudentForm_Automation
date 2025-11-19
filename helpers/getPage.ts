import { Page } from '@playwright/test';

/**
 * Gets page number of current page
 * @param activePage // Last activePage number
 */
export async function getPage(page: Page, activePage: number): Promise<number> {
    const activePageText = await page.locator('#staffTable_paginate .paginate_button.page-item.active a.page-link').textContent();
    activePage = parseInt(activePageText?.trim() ?? '0', 10);

    return activePage
}