import { faker } from '@faker-js/faker';
import { expect } from '@playwright/test';
import { FOUR_MINUTES, lessonSignUp, openRegistrationPane, serverRequest, test, VALID_CARD } from '../helpers';

test.describe('/calculate-lesson-total', () => {

  const amount = 123;
  let finalLessonTotalResponse;
  let initialLessonTotalResponse;
  let scheduleLessonResponse;
  

  test('Should Exist:6.1.1', async ({ request}) => {

    test.setTimeout(FOUR_MINUTES);

    finalLessonTotalResponse = await serverRequest(request, 'GET', 'calculate-lesson-total', undefined, FOUR_MINUTES);

    expect(finalLessonTotalResponse.net_total).toBeTruthy();
    expect(finalLessonTotalResponse.fee_total).toBeTruthy();
    expect(finalLessonTotalResponse.payment_total).toBeTruthy();

  });

  test('Should Return the Payment Total, Fee Total and Net Total Values:6.1.2', async ({ page, request }) => {

    test.setTimeout(2.5 * FOUR_MINUTES);

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await openRegistrationPane(page)

    await lessonSignUp(page, faker.name.findName(), faker.internet.email(), VALID_CARD);

    await expect(page.locator('#customer-id')).not.toBeEmpty();

    const customerId = await page.locator('#customer-id').textContent();

    initialLessonTotalResponse = await serverRequest(request, 'GET', 'calculate-lesson-total', undefined, FOUR_MINUTES);

    const scheduleLessonData = {
      customer_id: customerId,
      amount,
      description: 'Schedule Lesson Route API Test'
    };
    scheduleLessonResponse = await serverRequest(request, 'POST', 'schedule-lesson', scheduleLessonData);

    expect(scheduleLessonResponse.payment.id).toBeTruthy();
    expect(scheduleLessonResponse.payment.id).toContain('pi_');

    const completeLessonData = {
      payment_intent_id: scheduleLessonResponse.payment.id,
      amount
    };
    await serverRequest(request, 'POST', 'complete-lesson-payment', completeLessonData);

    finalLessonTotalResponse = await serverRequest(request, 'GET', 'calculate-lesson-total', undefined, FOUR_MINUTES);

    expect(finalLessonTotalResponse.net_total).toBeTruthy();
    expect(finalLessonTotalResponse.fee_total).toBeTruthy();
    expect(finalLessonTotalResponse.payment_total).toBeTruthy();
    expect(finalLessonTotalResponse.payment_total).toBe(initialLessonTotalResponse.payment_total + amount);
    expect(finalLessonTotalResponse.payment_total).toBe(finalLessonTotalResponse.net_total + finalLessonTotalResponse.fee_total);
    expect(finalLessonTotalResponse.fee_total !== initialLessonTotalResponse.fee_total);

  });

});

test.describe('/find-customers-with-failed-payments', () => {

  const name = faker.name.findName();
  const email = faker.internet.email();
  const cardNumber = '4000 0000 0000 0341';

  let customerId;
  let failedPaymentsResponse;

  test('Should Exist:6.2.1', async ({ page, request }) => {

    test.setTimeout(FOUR_MINUTES);

    // Go to http://localhost:${process.env.PORT}/lessons
    await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

    await page.locator('text=Lessons Courses').click({timeout: 1000});
    await openRegistrationPane(page)

    await lessonSignUp(page, name, email, cardNumber);

    await expect(page.locator('#customer-id')).not.toBeEmpty();

    customerId = await page.locator('#customer-id').textContent();

    const data = {
      customer_id: customerId,
      amount: 123,
      description: 'Schedule Lesson Route API Test'
    } 
    await serverRequest(request, 'POST', 'schedule-lesson', data);

    failedPaymentsResponse = await serverRequest(request, 'GET', 'find-customers-with-failed-payments', undefined, FOUR_MINUTES);
    
  });

  test('Should Return Information about the Customer, Customers Payment Method and Failed Payments:6.2.2', () => {

    const failedPayment = failedPaymentsResponse.find(failed => customerId === failed.customer.id);

    expect(failedPayment).toBeDefined();
    
    expect(failedPayment.customer).toBeDefined();
    expect(failedPayment.customer.id).toBeTruthy();
    expect(failedPayment.customer.name).toBe(name);
    expect(failedPayment.customer.email).toBe(email);

    expect(failedPayment.payment_method).toBeDefined();
    expect(failedPayment.payment_method.brand).toBe('visa');
    expect(failedPayment.payment_method.last4).toBe(cardNumber.slice(-4));

    expect(failedPayment.payment_intent).toBeDefined();
    expect(failedPayment.payment_intent.status).toBe('failed');
    expect(failedPayment.payment_intent.error).toBe('issuer_declined');

  });

});
