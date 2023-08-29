import { expect, Page } from '@playwright/test';
import { TYPE_DELAY } from "./constants";

export function makeDateString(someDate:Date){
    return someDate.toLocaleString('default', { day: '2-digit', timeZone: 'America/New_York'});
}

export const lessonSignUp = async (page:Page, name, email, card) => {
    
    await fillPersonalDetails(page, name, email);

    //click checkout
    await page.locator('#checkout-btn').click({timeout:1000});
    let stripeIframe = await locateStripeIFrame(page);
    await stripeIframe.getByLabel('Card number').click();
    
    await fillCardDetails(page, card);

    return await submitForm(page);
    
}

export const fillPersonalDetails = async (page:Page, name, email) => {

    // Fill [placeholder="Name"]
    await page.locator('[placeholder="Name"]').clear();
    await page.locator('[placeholder="Name"]').type(name);
    // Change the focus
    await page.locator('[placeholder="Email"]').press("Tab");
    // Fill [placeholder="Email"]
    await page.locator('[placeholder="Email"]').clear();
    await page.locator('[placeholder="Email"]').type(email);
    // Change the focus
    return await page.locator('[placeholder="Email"]').press("Tab");
}

export const locateStripeIFrame = async( page:Page) => {
    page.waitForLoadState();
    
    let iFrame = await page.frameLocator('.lesson-payment-element iframe[name*="__privateStripeFrame"]');
    const cardNumberLabel = await iFrame.getByLabel('Card number');
    await cardNumberLabel.click();
    return iFrame;
}

export const fillCardDetails = async (page:Page, card) => {

    let stripeIframe = await locateStripeIFrame(page);

    // Set the billing country to US, as labels are different in
    // other countries even if they're in English.  Specifically,
    // only the US calls it "ZIP" instead of "Postal code".
    await stripeIframe.getByLabel('Country').selectOption('US');
    
    // Fill [placeholder="Card number"]
    await stripeIframe.getByLabel('Card number').clear();
    await stripeIframe.getByLabel('Card number').type(card, {delay: TYPE_DELAY, timeout:1500});

    // Fill [placeholder="MM \/ YY"]
    await stripeIframe.getByLabel('Expiration').clear();
    await stripeIframe.getByLabel('Expiration').type('04 / 30', {delay: TYPE_DELAY});

    // Fill [placeholder="CVC"]
    await stripeIframe.getByLabel('CVC').clear();
    await stripeIframe.getByLabel('CVC').type('242', {delay: TYPE_DELAY});

    // Fill [placeholder="ZIP"]
    await stripeIframe.getByLabel('ZIP').clear();
    await stripeIframe.getByLabel('ZIP').type('42424', {delay: TYPE_DELAY});
    // Change the focus
    return await stripeIframe.getByLabel('ZIP').press("Tab");
}

export const submitForm = async (page:Page) => {
    return await page.locator('#submit').click({timeout: 3* 1000});
}

export const checkUrl = async (page:Page) => {
    return await expect(page).toHaveURL(`http://localhost:${process.env.PORT}/lessons`);
}

export const checkTitle = async (page:Page) => {
    const lessonsTitle = 'Guitar lessons';
    return await expect(page.locator('#title')).toHaveText(lessonsTitle,{timeout:500});
}

export const openRegistrationPane = async (page:Page) => {
    // Click #first
    await page.locator('#first').click({timeout: 750});

    // text=Registration Details is visible
    return await expect(page.locator('text=Registration Details')).toBeVisible({timeout:1000});
}

export const createCustomer = async (page:Page, customerName, customerEmail, card) => {
    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`);

    await page.locator('text=Lessons Courses').click({timeout: 3 * 1000});
    await openRegistrationPane(page);

    await lessonSignUp(page, customerName, customerEmail, card);

    // Wait for success
    await expect(page.locator('text=Woohoo! They are going to call you the shredder')).toBeVisible();

    let customerId = await page.locator('#customer-id').textContent();
    return customerId;
}

