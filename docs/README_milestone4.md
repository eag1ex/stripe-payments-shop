# Milestone 4: Accounting reports

This is the last milestone before Ipsum Street Music Shop is back in business, we're almost done. After you finish this Milestone, look out for a GitHub Issue with info about how to complete this engagement.

Back when our business was cash-only, our accountant regularly told us that our record keeping left a lot to be desired. In particular, they couldn't believe that we didn't have up-to-date numbers on revenue and delinquent payments. They insisted that maintaining accurate metrics would let us:

- Forecast our income more accurately
- Verify we're paying every team member appropriately
- Collect on more of our outstanding lesson payments

Now that we're starting back up, we and our accountant both want to make sure the business is built on a solid foundation.

## Requirements

We need your help implementing API endpoints to answer each of these questions:

1. How much total revenue we're making from lessons
2. Which students had failed to pay for their most recent lesson

## Total earned from lessons

Once we're on Stripe, we'll be able to use their Financial Reports to retrieve historical reporting data.  However, these reports are only [available](https://stripe.com/docs/reports/options#data-availability) on a roughly 36 hour delay.  We want to have a way to quickly check in on the past 36 hours of activity, until that gets into the Financial Reports.

Complete the `GET /calculate-lesson-total` endpoint to return the total amount of money the store has netted from lessons, minus any Stripe processing fees or refund costs, including refunds because of disputes. Only count lesson related transactions starting from the last 36 hours, up to and including the current moment.

The endpoint doesn't accept any parameters.

It returns the total revenue, processing costs, and net revenue — all as an integer number of cents to avoid errors from floating point logic.

_Ipsum Street Music Shop wants to include every transaction up until the request, so rather than [Searching](https://stripe.com/docs/search#data-freshness) or creating a [Report Run](https://stripe.com/docs/reports/options#data-availability), make sure to use the List API -- it is immediately consistent._

_The account we're testing with has a high volume of test payments, make sure you are retrieving every transaction from the last 36 hours.  Our test account includes many payments in various states; if the test passes on your account but not ours, try repeatedly running the test suite to generate more data._

## Find customers with bad payment methods

We're going to start emailing our students whose cards we couldn't authorize, asking them to plug in a new payment method.

Complete the `GET /find-customers-with-failed-payments` endpoint to return a list of customers who meet the following two requirements:

1. The last payment associated with them didn't succeed. Only check the last 36 hours of payments, as we'll run this at least once every day and a half.
2. The payment method on file for them matches the payment method used for the failed payment attempt. In other words, don't include customers who previously failed but have now updated their payment method.

The endpoint doesn't accept any parameters.

It returns an object where:

- The keys are the IDs of Customers with failed payments
- The values include key details about the failed payment, the customer, and their saved payment method.

_Test locally by [setting up Playwright](../test/README.md), starting your application's client and server, and then running `npx playwright test ./specs/milestone4.spec.ts` in the repo's `./test` directory._