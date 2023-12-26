import { test, expect } from '@playwright/test';
import { TimekeeperPage } from '../pages/timekeeper';
import { records } from '../test-data.json';
import { verifyAmountOfTimeZonesInLocalStorage } from '../helpers';
import { parse, isAfter, isEqual } from 'date-fns';

test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
        localStorage.clear();
    })
    await page.close();

});

test.describe('Verifying initial state', () => {
    let timePage: TimekeeperPage;
    test.beforeEach(async ({ page }) => {
        timePage = new TimekeeperPage(page);
        await timePage.goTo();
    });

    test('Initial state should only have one record', async ({ page }) => {
        await page.waitForLoadState();
        const rows = await page.$$eval('tbody tr', (rows => rows.length),)
        expect.soft(rows).toBe(1);
        await expect(page.getByRole('row', { name: 'Local(You)' })).toBeVisible();

    });

    test('Verify page title', async ({ page }) => {
        await expect(page).toHaveTitle(/Time Keeper/);
    })

    test('should have header and decription', async () => {
        await expect.soft(timePage.pageHeading).toBeVisible();
        await expect.soft(timePage.pageBanner).toHaveText('This app helps you keep track of your friends’ timezones!');
    })

    test('Should have add timezone button and form', async () => {
        await expect.soft(timePage.addTimeZoneBtn).toBeEnabled();
        await expect.soft(timePage.labelField).not.toBeVisible();
        await expect.soft(timePage.locationSelect).not.toBeVisible();
        await expect.soft(timePage.addZoneSubmitBtn).not.toBeVisible();
        await timePage.addTimeZoneBtn.click();
        await expect.soft(timePage.labelField).toBeVisible();
        await expect.soft(timePage.locationSelect).toBeVisible();
        await expect.soft(timePage.addZoneSubmitBtn).toBeVisible();
    })

    test('Default record should not have delete button', async ({ page }) => {
        await expect.soft(page.getByRole('button', { name: 'Delete , Local' })).not.toBeVisible();
        await expect.soft(page.getByRole('button', { name: 'Delete , Local' })).not.toBeEnabled();
    })
});

test.describe('Verify default local time is correct', () => {

    const timezonesToTest = ['Canada/Eastern', 'Canada/Pacific', 'America/Los_Angeles', 'Europe/Paris', 'Asia/Tokyo']

    for (const timezone of timezonesToTest) {

        test.describe(`Testing ${timezone}`, () => {
            test.use({
                timezoneId: `${timezone}`
            });

            test(`Default should show local time - ${timezone}`, async ({ page }) => {
                await page.goto('localhost:3000');

                const expectedTime = new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit' });
                const displayedTime = await page.locator('table tr td').filter({
                    hasText: /\b((1[0-2]|0?[1-9]):([0-5][0-9]) ([AaPp][Mm]))/
                }).textContent();

                expect(displayedTime).toBe(expectedTime);
            });
        });
    }
});

test.describe('Add timezones functionality', () => {
    let timePage: TimekeeperPage;
    test.beforeEach(async ({ page }) => {
        timePage = new TimekeeperPage(page);
        await timePage.goTo();
    });

    test('User should be able to add multiple timezone records for the same timezone', async ({ page }) => {
        const testRec = records[0];
        const testRec2 = records[8];
        await timePage.addARecord(testRec);
        await timePage.addARecord(testRec2);

        await expect.soft(page.getByRole('row', { name: testRec.label })).toContainText(testRec.timezone);
        await expect.soft(page.getByRole('row', { name: testRec2.label })).toContainText(testRec2.timezone);

        await verifyAmountOfTimeZonesInLocalStorage(page, 3);
    });

    records.forEach(record => {
        test(`Verify user can add any timezone: ${record.label}`, async ({ page }) => {

            await timePage.addARecord(record);

            await expect.soft(page.getByRole('row', { name: record.label })).toBeVisible();
        });
    });
});

test.describe('Delete functionality', () => {
    let timePage: TimekeeperPage;

    test.beforeEach(async ({ page }) => {
        timePage = new TimekeeperPage(page);
        await timePage.goTo();
        await timePage.addARecord(records[0]);
        await timePage.addARecord(records[1]);
    });

    test('Should not be able to delete default local', async ({ page }) => {
        await timePage.deleteRecord({ label: 'Local' });
        await expect(page.getByRole('row', { name: 'Local(You)' })).toBeVisible();
    })

    test('Should be able to delete added records', async ({ page }) => {
        const testRecLab = records[0].label;
        await timePage.deleteRecord({ label: testRecLab });
        await expect(page.getByRole('row', { name: `${testRecLab}` })).not.toBeVisible();
    })

})

test.describe('Layout of table', () => {
    let timePage: TimekeeperPage;

    test.beforeEach(async ({ page }) => {
        timePage = new TimekeeperPage(page);
        await timePage.goTo();

        for (const record of records) {
            await timePage.addARecord(record);
        }
    });

    test('Table should be sorted in order of earliest time to last', async ({ page }) => {
        const timeCells = await page.locator('table tr td').filter({
            hasText: /\b((1[0-2]|0?[1-9]):([0-5][0-9]) ([AaPp][Mm]))/
        }).allTextContents();
        const times = timeCells.map(timeCell => parse(timeCell, 'hh:mm a', new Date()));

        const timesSorted = times.every((value, index, arr) => index === 0 || isAfter(value, arr[index - 1]) || isEqual(value, arr[index - 1]));

        expect(timesSorted).toBe(true);
    });
});

