# Milestone 2: Paying for lessons

Our instructors used to have frustrating experiences getting paid — students showing up without cash-in-hand, or canceling an hour before the scheduled lesson.  We decided that if we're going to build a new system, we should do our best to prevent these issues from happening at all.

We designed the following payment collection schedule:
1. At 5 days before the scheduled lesson, we'll put a hold (i.e. authorize a pending payment) on the student's card.  If this doesn't go through, then we can immediately start booking a new student for our instructor.
2. If a student cancels one or two days before their lesson, we'll capture half of the payment as a late cancellation fee.
3. On the morning of the lesson, we capture the payment in full (no refunds if students cancel on the day of).s

If an instructor has to shorten or cancel a lesson, then we'll send a partial or full refund.  For peace of mind, we would like to manually control each of these steps.
## Requirements

This collection schedule works out to three different payment interactions we need your help implementing: 
- Putting a hold on the student's saved card
- Capturing the funds, either fully or partially
- Refunding the payment, either fully or partially

Our previous developer never got around to building an admin interface for us to do so, but said we could use Postman ([install](https://learning.postman.com/docs/getting-started/installation-and-updates/), [make requests](https://learning.postman.com/docs/getting-started/sending-the-first-request/)) to directly interact with the server.

_This integration will never be deployed on the public internet, so you don't need to set up any authentication for your server._
### Authorize the lesson payment

Complete the `POST /schedule-lesson` endpoint so we can put holds on the student's cards for upcoming lessons.  

It accepts the following parameters:
- `customer_id`, the student's Stripe Customer ID
- `amount`, the price of the lesson 
- `description`, the lesson instrument

It returns the Payment Intent object if successful, otherwise returns error details.

These payments are all in `usd`, include a metadata field  `type: 'lessons-payment'` so that we can identify them in the future.

### Complete a lesson payment

Complete the `POST /complete-lesson-payment` endpoint to capture an authorized charge for a lesson.  

It accepts the following parameters:
- `payment_intent_id`: the Payment Intent to capture
- `amount`: (optional) only specified if capturing a different amount than previously authorized

It returns the Payment Intent object if successful, otherwise it returns error details.

### Refund a lesson

Complete the `POST /refund-lesson` endpoint so we can send refunds to our students.

It accepts the following parameters:
- `payment_intent_id`: the id of the payment intent to refund
- `amount`: (optional) only specified if refunding a different amount than previously captured

It returns the Refund object if successful, otherwise it returns error details.

_Test locally by [setting up Playwright](../test/README.md), starting your application's client and server, and then running `npx playwright test ./specs/milestone2.spec.ts` in the repo's `./test` directory._