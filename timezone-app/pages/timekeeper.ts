import { Page, Locator } from "@playwright/test"

type TzRecord = {
    label: string,
    location: string
    timezone: string
}
export class TimekeeperPage {
    page: Page;
    pageBanner: Locator;
    pageHeading: Locator;
    addTimeZoneBtn: Locator;
    labelField: Locator;
    locationSelect: Locator;
    addZoneSubmitBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.pageHeading = page.getByRole('heading', { name: 'Time Keeper' });
        this.pageBanner = page.getByText('This app helps you keep track');
        this.addTimeZoneBtn = page.getByRole('button', { name: 'Add timezone' });
        this.labelField = page.getByPlaceholder('Label');
        this.locationSelect = page.getByLabel('Location');
        this.addZoneSubmitBtn = page.getByRole('button', { name: 'Save' });

    }

    async goTo() {
        await this.page.goto('localhost:3000')
    }

    async addARecord({ label, location }: TzRecord) {

        await this.addTimeZoneBtn.click();
        await this.labelField.fill(label);
        await this.locationSelect.selectOption(location, { timeout: 5000 })
        await this.addZoneSubmitBtn.click();
    }
    async deleteRecord(testRecord: { label: string }) {
        await this.page.getByRole('button', { name: `Delete , ${testRecord.label}` }).click();
    }
}


