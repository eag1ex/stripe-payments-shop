import { faker } from '@faker-js/faker';
import { expect } from '@playwright/test';
import { createCustomer, fillCardDetails, FIVE_SECONDS, serverRequest, stripeRequest, submitForm, test, TWENTY_SECONDS, TYPE_DELAY, VALID_3DS, VALID_CARD } from '../helpers';

test.describe('Updating account details', () => {

  let emailIdTest = faker.internet.email();
  let oldPaymentMethod;
  let customerId;

  // Using this boolean to automatically bail out of tests if the
  // baseline "schedule lesson" functionality isn't behaving
  let customerCreated = false;
  test.beforeAll(async ({ browser, request }) => {

    test.setTimeout(40 * 1000)

    const testPage = await browser.newPage();

    let tempName = faker.name.findName();
    customerId = await createCustomer(testPage, tempName, emailIdTest, VALID_CARD);

    oldPaymentMethod = await stripeRequest(request, 'GET', `customers/${customerId}/payment_methods?type=card`);

    // If we get here, then it's worth checking other cards too
    customerCreated = true;
  });

  test('Should Load and Display the Account Details:5.1.1', async ({ page, request, browser }) => {

    test.skip(!customerCreated, "If customer does not exist then test will fail.")
    
    await page.goto(`http://localhost:${process.env.PORT}/account-update/${customerId}`, { waitUntil: 'networkidle' });

    await expect(page.locator('#billing-email')).not.toBeEmpty();

    const billingEmail = await page.locator('#billing-email').textContent();
    const cardExpMonth = await page.locator('#card-exp-month').textContent();
    const cardExpYear = await page.locator('#card-exp-year').textContent();
    const cardLast4 = await page.locator('#card-last4').textContent();
    await expect(billingEmail).toContain(emailIdTest);
    await expect(cardExpMonth).toContain('4');
    await expect(cardExpYear).toContain('2030');
    await expect(cardLast4).toContain('4242');

  });


  test('Should allow Customer to Update Card Data without filling Name and EmailId:5.1.3', async ({ page, browser }) => {
    test.skip(!customerCreated, "If customer does not exist then test will fail.")

    browser.on('disconnected', data => { console.log(JSON.stringify(data, null, 2)) });

    const newCardNumber = '5555 5555 5555 4444';
    const newLast4 = newCardNumber.slice(-4);

    await page.goto(`http://localhost:${process.env.PORT}/account-update/${customerId}`, { waitUntil: 'networkidle' });
    
    //click checkout
    await page.locator('#checkout-btn').click({timeout:1000});
    
    await fillCardDetails(page, newCardNumber);

    // Click #submit
    await submitForm(page);

    await page.waitForSelector(`text=Card last 4: 4444`);
    const cardLast4 = await page.locator('#card-last4').textContent();

    await expect(cardLast4).toContain(newLast4);

  });

  test('Should not allow usage of existing Customer Email ID while Updating Account Info:5.1.4', async ({ page }) => {
    test.skip(!customerCreated, "If customer does not exist then test will fail.")

    let tempName = faker.name.findName();
    let tempEmail = faker.internet.email();
    let newCustomerId = await createCustomer(page, tempName, tempEmail, VALID_CARD);

    await page.goto(`http://localhost:${process.env.PORT}/account-update/${newCustomerId}`, { waitUntil: 'networkidle' });

    await page.locator('[placeholder="Email"]').click();
    await page.locator('[placeholder="Email"]').fill('');

    // Fill [placeholder="Name"]
    await page.locator('[placeholder="Email"]').type(emailIdTest, {delay: TYPE_DELAY});

    // Click #submit
    await page.locator('#checkout-btn').click();

    await page.waitForSelector('text=Customer email already exists!');
    await expect(page.locator('text=Customer email already exists!')).toBeVisible();

  });

  test('Should attach new Payment Method and Delete old one after Card Update:5.1.5', async ({ page, request }) => {
    test.skip(!customerCreated, "If customer does not exist then test will fail.")
    const newCardNumber = '5555 5555 5555 4444';
    const newLast4 = newCardNumber.slice(-4);

    await page.goto(`http://localhost:${process.env.PORT}/account-update/${customerId}`, { waitUntil: 'networkidle' });
    
    //click checkout
    await page.locator('#checkout-btn').click({timeout:1000});
    
    await fillCardDetails(page, newCardNumber);

    // Click #submit
    await submitForm(page);

    await page.waitForSelector(`text=Card last 4: 4444`);
    const cardLast4 = await page.locator('#card-last4').textContent();

    await expect(cardLast4).toContain(newLast4);

    const newPaymentMethod = await stripeRequest(request, 'GET', `customers/${customerId}/payment_methods?type=card`);
    
    expect(newPaymentMethod.has_more).toBe(false);
    expect(newPaymentMethod.data[0].id).not.toEqual(oldPaymentMethod.data[0].id);
    expect(newPaymentMethod.data[0].card.brand).not.toEqual(oldPaymentMethod.data[0].card.brand);
    expect(newPaymentMethod.data[0].card.last4).not.toEqual(oldPaymentMethod.data[0].card.last4);
  });

  test('Should show Error Message if Invalid Card is used while Updating Account Info:5.1.6', async ({ page }) => {

    test.skip(!customerCreated, "If customer does not exist then test will fail.")

    await page.goto(`http://localhost:${process.env.PORT}/account-update/${customerId}`, { waitUntil: 'networkidle' });

    await page.waitForSelector('#checkout-btn');
    await expect(page.locator('[placeholder="Email"]')).not.toBeEmpty();

    //click checkout
    await page.locator('#checkout-btn').click({timeout:1000});

    await fillCardDetails(page, '4000 0000 0000 0002');
    await submitForm(page);

    await expect(page.locator('text=Your card has been declined.')).toBeVisible({ timeout: FIVE_SECONDS });

  });

  test('Should show Error Message if Invalid 3DS Card is used while Updating Account Info:5.1.7', async ({ page }) => {

    test.skip(!customerCreated, "If customer does not exist then test will fail.")
    test.setTimeout(60 * 1000)

    await page.goto(`http://localhost:${process.env.PORT}/account-update/${customerId}`, { waitUntil: 'networkidle' });
    
    await page.waitForSelector('#checkout-btn');
    await expect(page.locator('[placeholder="Email"]')).not.toBeEmpty();    //click checkout
    await page.locator('#checkout-btn').click({timeout:1000});

    await fillCardDetails(page, VALID_3DS);
    await submitForm(page);

    await page.waitForResponse((res) => {
      return res.url().includes('https://stripe.com');
    }, { timeout: TWENTY_SECONDS });

    // Extra delay to wait for 3DS modal to finish rendering
    await page.waitForTimeout(4000);

    // Click text=Fail authentication
    await page.frame({name: 'acsFrame'})?.locator('text=Fail authentication').click({ timeout: 30 * 1000});

    await expect(page.locator('text=We are unable to authenticate your payment method. Please choose a different payment method and try again.')).toBeVisible({ timeout: 30 * 1000 });

  });

  test('Should allow Customer to Successfully Update Payment after Card Decline:5.1.8', async ({ page }) => {

    test.skip(!customerCreated, "If customer does not exist then test will fail.")

    await page.goto(`http://localhost:${process.env.PORT}/account-update/${customerId}`, { waitUntil: 'networkidle' });
    
    await page.waitForSelector('#checkout-btn');
    await expect(page.locator('[placeholder="Email"]')).not.toBeEmpty();
    //click checkout
    await page.locator('#checkout-btn').click({timeout:1000});
    
    await fillCardDetails(page, '4000 0000 0000 0002');
    await submitForm(page);

    await expect(page.locator('text=Your card has been declined.')).toBeVisible();

    await fillCardDetails(page, '5555 5555 5555 4444');
    await submitForm(page);

    await page.waitForSelector(`text=Card last 4: 4444`);
    const cardLast4 = await page.locator('#card-last4').textContent();
    await expect(cardLast4).toContain('4444');

  });

});

test.describe('Deleting customers', () => {

  let customerId;
  let scheduleLessonResponse;
  let deleteUncapturedCustomerResponse;
  let customerCreated = false;
  let oldPaymentMethod;

  test.beforeAll(async ({ browser, request }) => {

    test.setTimeout(30 * 1000)

    const testPage = await browser.newPage();

    let tempName = faker.name.findName();
    let tempEmail = faker.internet.email();
    customerId = await createCustomer(testPage, tempName, tempEmail, VALID_CARD);

    oldPaymentMethod = await stripeRequest(request, 'GET', `customers/${customerId}/payment_methods?type=card`);

    // If we get here, then it's worth checking other cards too
    customerCreated = true;
  });


  test('Should not Delete Customers with Uncaptured Payments:5.2.2', async ({ page, request}) => {

    test.skip(!customerCreated, "If customer does not exist then test will fail.")

    await page.goto(`http://localhost:${process.env.PORT}/account-update/${customerId}`, { waitUntil: 'networkidle' });
    
    await page.waitForSelector('#checkout-btn');
    await expect(page.locator('[placeholder="Email"]')).not.toBeEmpty();
    const data = {
      customer_id: customerId,
      amount: 123,
      description: 'Schedule Lesson Route API Test',
    }
    scheduleLessonResponse = await serverRequest(request, 'POST', 'schedule-lesson', data);

    deleteUncapturedCustomerResponse = await serverRequest(request, 'POST', `delete-account/${customerId}`);

    expect(deleteUncapturedCustomerResponse.deleted === undefined);
    expect(deleteUncapturedCustomerResponse.uncaptured_payments).toBeTruthy();

  });

  test('Should list Uncaptured Payments when Deleting Customers with Uncaptured Payments:5.2.3', () => {

    expect(deleteUncapturedCustomerResponse.uncaptured_payments).toBeTruthy();
    expect(deleteUncapturedCustomerResponse.uncaptured_payments[0]).toBe(scheduleLessonResponse.payment.id);

  });

  test('Should Delete Customers with Captured Payments:5.2.1', async ({ page, request }) => {

    test.skip(!customerCreated, "If customer does not exist then test will fail.")

    await page.goto(`http://localhost:${process.env.PORT}/account-update/${customerId}`, { waitUntil: 'networkidle' });

    const scheduleLessonData = {
      customer_id: customerId,
      amount: 123,
      description: 'Schedule Lesson Route API Test',
    }
    scheduleLessonResponse = await serverRequest(request, 'POST', 'schedule-lesson', scheduleLessonData);


    const data = {
      payment_intent_id: scheduleLessonResponse.payment.id,
      amount: '123'
    }
    await serverRequest(request, 'POST', 'complete-lesson-payment', data);

    const response = await serverRequest(request, 'POST', `delete-account/${customerId}`);
    console.log(`Response from POST /delete-account/:id : ${JSON.stringify(response)}`);
    await expect(response.deleted).toBe(true);

  });

});
