import { Page } from '@playwright/test';

export async function verifyAmountOfTimeZonesInLocalStorage(page: Page, expected: number | undefined) {
    return await page.waitForFunction((exp) => {
        return JSON.parse(localStorage['timekeeperdb']).length === exp;
    }, expected);
}


