import { faker } from '@faker-js/faker';
import { expect } from '@playwright/test';
import { createCustomer, serverRequest, stripeRequest, test, VALID_CARD } from '../helpers';

test.describe('Paying for lessons', () => {

  let scheduleLessonResponse;
  let completePaymentResponse;
  let refundId;

  test.beforeAll(async ({ browser, request }) => {

    test.setTimeout(30 * 1000)

    const testPage = await browser.newPage();

    const customerId = await createCustomer(testPage, faker.name.findName(), faker.internet.email(), VALID_CARD);
    const data = {
      customer_id: customerId,
      amount: 123,
      description: 'Schedule Lesson Route API Test',
    }
    scheduleLessonResponse = await serverRequest(request, 'POST', 'schedule-lesson', data);
    scheduleLessonResponse = scheduleLessonResponse.payment;
  })

  test('Should Accept Customer, Amount, and Description as its Input Parameters:4.1.1', async ({ page, request }) => {
    expect(scheduleLessonResponse.id).toBeTruthy();
  });

  test('Should Create a Payment Intent:4.1.2', async () => {
    expect(scheduleLessonResponse.id).toBeTruthy();
    expect(scheduleLessonResponse.id).toContain('pi_');
    expect(scheduleLessonResponse.amount_received).toBe(0);
    expect(scheduleLessonResponse.amount_capturable).toBe(123);
    expect(scheduleLessonResponse.status).toBe('requires_capture');
  });

  test('Should Return a Payment Intent Object upon Succesful Scheduling of a Lesson:4.1.3', async () => {
    expect(scheduleLessonResponse.object).toBeTruthy();
    expect(scheduleLessonResponse.object).toBe('payment_intent');
  });

  test('Should Return an Error when using an Invalid Customer ID:4.1.4', async ({ request }) => {

    const invalidCustomerId = 'ci_invalid';

    const data = {
      customer_id: invalidCustomerId,
      amount: 123,
      description: 'Schedule Lesson Route API Test',
    }
    const response = await serverRequest(request, 'POST', 'schedule-lesson', data);

    expect(response.error.code).toBeTruthy();
    expect(response.error.code).toBe('resource_missing');

    expect(response.error.message).toBeTruthy();
    expect(response.error.message).toBe(`No such customer: '${invalidCustomerId}'`);

  });

  test('Should Create Payment Intents in USD:4.1.5', () => {

    expect(scheduleLessonResponse.currency).toBeTruthy();
    expect(scheduleLessonResponse.currency).toBe('usd');

  });

  test('Should Accept Payment Intent ID and an Optional Amount as Input Parameters.:4.2.1', async ({ request }) => {

    const data = {
      payment_intent_id: scheduleLessonResponse.id,
      amount: 123,
    }
    completePaymentResponse = await serverRequest(request, 'POST', 'complete-lesson-payment', data);
    completePaymentResponse = completePaymentResponse.payment;

  });

  test('Should Capture and Confirm the Payment Intent:4.2.2', () => {

    expect(completePaymentResponse.id).toBeTruthy();
    expect(completePaymentResponse.id).toContain('pi_');
    expect(completePaymentResponse.amount_capturable).toBe(0);
    expect(completePaymentResponse.amount_received).toBe(123);
    expect(completePaymentResponse.status).toBe('succeeded');

  });

  test('Should Return a Payment Intent Object upon Succesful Payment Capture:4.2.3', () => {

    expect(completePaymentResponse.object).toBeTruthy();
    expect(completePaymentResponse.object).toBe('payment_intent');

  });

  test('Should Return an Error when using Invalid Paramaters:4.2.4', async ({ request }) => {

    const invalidPaymentIntent = 'pi_invalid';

    const data = {
      payment_intent_id: invalidPaymentIntent,
      amount: 123,
    }
    const response = await serverRequest(request, 'POST', 'complete-lesson-payment', data);

    expect(response.error.code).toBeTruthy();
    expect(response.error.code).toBe('resource_missing');

    expect(response.error.message).toBeTruthy();
    expect(response.error.message).toBe(`No such payment_intent: '${invalidPaymentIntent}'`);

  });

  test('Should Accept Payment Intent ID and an Amount as Input Parameters.:4.3.1', async ({ request }) => {
        
    const data = {
      payment_intent_id: scheduleLessonResponse.id,
      amount: 123,
    }
    refundId = await serverRequest(request, 'POST', 'refund-lesson', data);
    refundId = refundId.refund;

  });

  test('Should Refund the Customer for the Lesson Amount.:4.3.2', async ({ request }) => {

    const response = await stripeRequest(request, 'GET', `refunds/${refundId}`);

    expect(response.amount).toBeTruthy();
    expect(response.amount).toBe(123);

  });

  test('Should Return a Refund Object ID if the Refund was Successful:4.3.3', () => {

    expect(refundId).toBeTruthy();
    expect(refundId).toContain('re_');

  });

  test('Should Return an Error when using Invalid Paramaters:4.3.4', async ({ request }) => {

    const invalidPaymentIntent = 'pi_invalid';

    const data = {
      payment_intent_id: invalidPaymentIntent,
      amount: 123,
    }
    const response = await serverRequest(request, 'POST', 'refund-lesson', data);

    expect(response.error.code).toBeTruthy();
    expect(response.error.code).toBe('resource_missing');

    expect(response.error.message).toBeTruthy();
    expect(response.error.message).toBe(`No such payment_intent: '${invalidPaymentIntent}'`);

  });

});
