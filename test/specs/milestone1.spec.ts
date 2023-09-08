import { faker } from '@faker-js/faker';
import { chromium, expect } from '@playwright/test';
import { checkTitle, fillCardDetails, fillPersonalDetails, FIVE_SECONDS, lessonSignUp, openRegistrationPane, serverRequest, stripeRequest, makeDateString, submitForm, test, TWENTY_SECONDS, TYPE_DELAY, VALID_CARD } from '../helpers';

test.describe('Lesson signup form', () => {

  test('Should not find any Invalid/Hardcoded PubKey in the BeforeAll Hook Check:3.0', async ({ page, request }) => {

    const pubKey = await serverRequest(request, 'GET', 'config', undefined, 2500);

    expect(pubKey.key.includes('pk_test')).toBe(true);

  });

  test('Should load Stripe Elements:3.7', async ({ page }) => {

    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });
  
    // Click text=Lessons Courses
    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await checkTitle(page);
    await openRegistrationPane(page);
  
    // Stripe JS should exist
    await expect(page.frame('iframe[src*="https://js.stripe.com/"]')).toBeDefined();

    await fillPersonalDetails(page, faker.name.findName(), faker.internet.email());

    await page.locator('#checkout-btn').click({timeout:1000});

    // PaymentElement should be visible
    await page.frameLocator('iframe[name*="__privateStripeFrame"]').first().getByLabel('Card number').click();

  });

  test('Should allow user to change Lesson Time after Elements is shown:3.9', async ({ page }) => {
  
    const currDate = new Date();
    currDate.setDate(currDate.getDate() + 9);

    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });
  
    // Click text=Lessons Courses
    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await checkTitle(page);
    await openRegistrationPane(page);
  
    // Stripe JS should exist
    await expect(page.frame('iframe[src*="https://js.stripe.com/"]')).toBeDefined();

    await fillPersonalDetails(page, faker.name.findName(), faker.internet.email());

    await page.locator('#checkout-btn').click({timeout:1000});

    // PaymentElement should be visible
    await page.frameLocator('iframe[name*="__privateStripeFrame"]').first().getByLabel('Card number').click();

    currDate.setDate(currDate.getDate() + 5);

    // Click #second
    await page.locator('#second').click();
  
    const secondSummaryTable = await page.locator('#summary-table').textContent();
    await expect(secondSummaryTable).toContain(makeDateString(currDate));
  
  });


  test('Should collect necessary Inputs from User:3.10', async ({ page }) => {

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    // Click text=Lessons Courses
    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await checkTitle(page);
    await openRegistrationPane(page);
  
    // Stripe JS should exist
    await expect(page.frame('iframe[src*="https://js.stripe.com/"]')).toBeDefined();
    
  });

  test('Should have Email and Name as Mandatory Fields:3.11', async ({ page }) => {

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    // Click text=Lessons Courses
    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await checkTitle(page);
    await openRegistrationPane(page);
  
    // Make sure checkout button is disabled
    await expect(page.locator('#checkout-btn')).toBeDisabled();

    // Fill [placeholder="Name"]
    await page.locator('[placeholder="Name"]').type(faker.name.findName(), {delay: TYPE_DELAY});

    // Press Tab
    await page.locator('[placeholder="Name"]').press('Tab');

    // Make sure checkout button is disabled
    await expect(page.locator('#checkout-btn')).toBeDisabled();

    // Fill [placeholder="Email"]
    await page.locator('[placeholder="Email"]').type(faker.internet.email(), {delay: TYPE_DELAY});

    // Press Tab
    await page.locator('[placeholder="Email"]').press("Tab");

    // Make sure checkout button is enabled
    await expect(page.locator('#checkout-btn')).toBeEnabled();

    //click checkout
    await page.locator('#checkout-btn').click({timeout:1000});

    // PaymentElement should be visible
    await page.frameLocator('iframe[name*="__privateStripeFrame"]').first().getByLabel('Card number').click();
    await fillCardDetails(page, VALID_CARD);
    // Make sure submit button is enabled
    await expect(page.locator('#submit')).toBeEnabled();

  });

});

test.describe('Using different test cards', () => {

  // Using this boolean to automatically bail out of tests if the
  // baseline "schedule lesson" functionality isn't behaving
  let scheduleLessonWorking = false;

  test.beforeAll(async ({ browser }) => {

    test.setTimeout(20 * 1000)

    const testPage = await browser.newPage();

    // Go to http://localhost:${process.env.PORT}/lessons
    await testPage.goto(`http://localhost:${process.env.PORT}/lessons`);

    // Click #first
    await testPage.locator('#first').click();

    await lessonSignUp(testPage, faker.name.findName(), faker.internet.email(), VALID_CARD);

    await testPage.locator('text=Woohoo! They are going to call you the shredder');

    // If we get here, then it's worth checking other cards too
    scheduleLessonWorking = true;
  })

  test('Should disable the Request Lesson Button while Setup Intents are created/used:3.12', async ({ page }) => {

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });
    await page.locator('text=Lessons Courses').click({timeout: 1000});

    await openRegistrationPane(page);

    await lessonSignUp(page, faker.name.findName(), faker.internet.email(), VALID_CARD);

    // Make sure spinner is disabled
    await expect(page.locator('#spinner.spinner')).toBeVisible();
    await expect(page.locator('#submit')).toBeDisabled();

  });

  test('Should schedule a Lesson using a non 3DS Card:3.21', async ({ page, request }) => {

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });
    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await openRegistrationPane(page);
    await lessonSignUp(page, faker.name.findName(), faker.internet.email(), VALID_CARD);

    // Expect success
    await expect(page.locator('text=Woohoo! They are going to call you the shredder')).toBeVisible();
  });

  test('Should schedule a Lesson using a 3DS Card:3.22', async ({ page }) => {

    test.skip(!scheduleLessonWorking, "If success card fails, other cards won't work either");

    test.setTimeout(90 * 1000);

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await openRegistrationPane(page);

    await lessonSignUp(page, faker.name.findName(), faker.internet.email(), '4000 0027 6000 3184');

    await page.waitForResponse((res) => {
      return res.url().includes('https://stripe.com');
    }, { timeout: 40 * 1000 });

    // Extra delay to wait for 3DS modal to finish rendering
    await page.waitForTimeout(4000);

    // Click text=Complete authentication
    await page.frame({name: 'acsFrame'})?.locator('text=Complete authentication').click({ timeout: 30 * 1000 });

    // Expect success
    await expect(page.locator('text=Woohoo! They are going to call you the shredder')).toBeVisible({ timeout: 30 * 1000 });
  
  });

  test('Should show Last 4 Card Digits after successful checkout:3.23', async ({ page }) => {

    test.skip(!scheduleLessonWorking, "If success card fails, other cards won't work either")

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await openRegistrationPane(page);

    await lessonSignUp(page, faker.name.findName(), faker.internet.email(), VALID_CARD);

    await expect(page.locator('#spinner.spinner')).not.toBeVisible();

    const last4 = await page.locator('#last4').textContent();
    await expect(last4).toBe('4242');

  });

  test('Should not allow Customer to use same Email Twice for Lesson Registration:3.24', async ({ page }) => {

    test.skip(!scheduleLessonWorking, "If success card fails, other cards won't work either")

    const email = faker.internet.email();

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await openRegistrationPane(page);

    await lessonSignUp(page, faker.name.findName(), email, VALID_CARD);
    await expect(page.locator('#spinner.spinner')).not.toBeVisible();
    const last4 = await page.locator('#last4').textContent();
    await expect(last4).toBe('4242');

    await page.locator('text=Sign up again under a different email address').click();

    await openRegistrationPane(page);

    await fillPersonalDetails(page, faker.name.findName(), email);
    //click checkout
    await page.locator('#checkout-btn').click({timeout:1000});

    await expect(page.locator('text=A customer with that email address already exists. If you\'d like to update the c')).toBeVisible();

  });

  test('Should Display Card Declined Error Message when Invalid Card is used:3.25', async ({ page }) => {

    test.skip(!scheduleLessonWorking, "If success card fails, other cards won't work either")

    const email = faker.internet.email();

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await openRegistrationPane(page);

    await lessonSignUp(page, faker.name.findName(), email, '4000 0000 0000 0002');

    // Click text=Your card has been declined.
    await expect(page.locator('text=Your card has been declined.')).toBeVisible();

  });

  test('Should Display Card Declined Error Message when Invalid 3DS Card is used:3.26', async ({ page }) => {

    test.skip(!scheduleLessonWorking, "If success card fails, other cards won't work either")

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await openRegistrationPane(page);

    await lessonSignUp(page, faker.name.findName(), faker.internet.email(), '4000 0027 6000 3184');

    await page.waitForResponse((res) => {
      return res.url().includes('https://stripe.com');
    }, { timeout: TWENTY_SECONDS });

    // Extra delay to wait for 3DS modal to finish rendering
    await page.waitForTimeout(4000);

    // Click text=Fail authentication
    await page.frame({ name: 'acsFrame' })?.locator('text=Fail authentication').click({ timeout: 30 * 1000});

    // Click text=We are unable to authenticate your payment method. Please choose a different pay
    await page.locator('text=We are unable to authenticate your payment method. Please choose a different pay').click({ timeout: 30 * 1000});

  });

  test('Should allow Customer to update card and retry after Card Decline:3.27', async ({ page }) => {

    test.skip(!scheduleLessonWorking, "If success card fails, other cards won't work either")

    const email = faker.internet.email();

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await openRegistrationPane(page);

    await lessonSignUp(page, faker.name.findName(), email, '4000 0000 0000 0002');

    // Click text=Your card has been declined.
    await expect(page.locator('text=Your card has been declined.')).toBeVisible();

    await fillCardDetails(page, VALID_CARD);

    // Click #submit
    // await page.locator('#submit').click();
    await submitForm(page);
    // Expect success
    await expect(page.locator('text=Woohoo! They are going to call you the shredder')).toBeVisible();

  });

});

test.describe('Validating saved card and customer', () => {

  const name = faker.name.findName();
  const email = faker.internet.email();

  let customerResponse;
  let paymentMethodResponse;

  test.beforeAll(async ({ request }) => {

    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    // Click #first
    await page.locator('#first').click();

    await lessonSignUp(page, name, email, VALID_CARD);

    await expect(page.locator('#spinner.spinner')).not.toBeVisible();

    const customerId = await page.locator('#customer-id').textContent();

    customerResponse = await stripeRequest(request, 'GET', `customers/${customerId}`)
    paymentMethodResponse = await stripeRequest(request, 'GET', `customers/${customerId}/payment_methods?type=card`)

    browser.close();

  });

  test('Should attach only one Payment Method per Customer:3.28', async () => {

    expect(paymentMethodResponse.has_more).toBe(false);

  }); 

  test('Should set Name and Email on both the Customer and the Payment Method Objects:3.29', () => {

    expect(customerResponse.name).toBeTruthy()
    expect(customerResponse.email).toBeTruthy();
    expect(customerResponse.name).toBe(name);
    expect(customerResponse.email).toBe(email);

    expect(paymentMethodResponse.data[0].billing_details.name).toBeTruthy();
    expect(paymentMethodResponse.data[0].billing_details.email).toBeTruthy();
    expect(paymentMethodResponse.data[0].billing_details.name).toBe(name);
    expect(paymentMethodResponse.data[0].billing_details.email).toBe(email);

  });

  test('Should add the Metadata about the First Lesson to the Customer Object:3.30', () => {
      
    const currDate = new Date();
    currDate.setDate(currDate.getDate() + 9);

    const lessonDateMonth = `${makeDateString(currDate)} ${currDate.toLocaleString('default', { month: 'short', timeZone: 'America/New_York'})}`;

    expect(customerResponse.metadata.first_lesson).toBeTruthy();
    expect(customerResponse.metadata.first_lesson).toContain(lessonDateMonth);

  });

});
