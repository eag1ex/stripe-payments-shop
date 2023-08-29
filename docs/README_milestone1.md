# Milestone 1: Signing up

> _Note: This milestone lays the foundation for all the others and tends to take the longest. Don't be discouraged!_

We want to start charging our music students online. 

While music lessons are often sold as month-to-month subscriptions, I want to appeal to busy adults who can't commit to weekly lessons.  Students need to save a credit card and pick a first lesson time, but we want to wait until the lesson is sooner to charge them.  

For now, only focus on letting them set up an account and pick their first lesson time.
## Requirements

Complete the Lessons page and implement a `POST /lessons` endpoint for signing up the student.
<br />

Require the student to provide their account information, a credit card, and an initial lesson time.  Use a Setup Intent to get authorization for future payments.  We don't want to put a hold on the card yet, as the lessons can be more than 7 days away.
- After the student successfully signs up for a lesson, complete the message in the `id="signup-status"` div to show the new customer id and the last 4 digits of their card.
- Make sure you have only one Customer object per email address.  If a student tries to sign up again with the same email address, have the app show them the included error message and provide them with a link to the `account-update` page where they can update their payment information.
- Save the provided name and email address on the billing details for both the Customer and the Payment Method.  Make sure the Customer only ever has one saved payment method.
- Add a metadata field to the Customer named `first_lesson` which is set to the lesson date and time they select.  We'll use this later to determine when to make the first payment.

_While a real application would have its own customer database which stores a reference to the Stripe Customer ID, you can use the Customer object IDs throughout this challenge._

_Test locally by [setting up Playwright](../test/README.md), starting your application's client and server, and then running `npx playwright test ./specs/milestone1.spec.ts` in the repo's `./test` directory._