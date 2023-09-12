const express = require("express");
const apiRouter = express.Router();
const { resolve } = require("path");
const fs = require("fs");
/**
 * API router
 * @param {import('stripe').Stripe} stripe
 * @returns
 */
exports.apiRouter = (stripe) => {
  // import and mount api routes
  apiRouter.get("/config", (req, res) => {
    res.send({
      key: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  });

  require("./ctrs").card(stripe, apiRouter);
  require("./ctrs").lessons(stripe, apiRouter);
  require("./ctrs").payments(stripe, apiRouter);

  // Milestone 3: Managing account info
  // Displays the account update page for a given customer
  apiRouter.get("/account-update/:customer_id", async (req, res) => {
    try {
      const path = resolve(`${process.env.STATIC_DIR}/account-update.html`);
      if (!fs.existsSync(path)) throw Error();
      res.sendFile(path);
    } catch (error) {
      const path = resolve("./public/static-file-error.html");
      res.sendFile(path);
    }
  });

  apiRouter.post("/update-payment-details/:customer_id", async (req, res) => {
    // TODO: Update the customer's payment details
  });

  // Handle account updates
  apiRouter.post("/account-update", async (req, res) => {
    // TODO: Handle updates to any of the customer's account details
  });

  // Milestone 3: '/delete-account'
  // Deletes a customer object if there are no uncaptured payment intents for them.
  //
  // Parameters:
  //   customer_id: the id of the customer to delete
  //
  // Example request
  //   curl -X POST http://localhost:4242/delete-account/:customer_id \
  //
  // Returns 1 of 3 responses:
  // If the customer had no uncaptured charges and was successfully deleted returns the response:
  //   {
  //        deleted: true
  //   }
  //
  // If the customer had uncaptured payment intents, return a list of the payment intent ids:
  //   {
  //     uncaptured_payments: ids of any uncaptured payment intents
  //   }
  //
  // If there was an error:
  //  {
  //    error: {
  //        code: e.error.code,
  //        message: e.error.message
  //      }
  //  }
  //
  apiRouter.post("/delete-account/:customer_id", async (req, res) => {
    // TODO: Integrate Stripe
  });

  // Milestone 4: '/calculate-lesson-total'
  // Returns the total amounts for payments for lessons, ignoring payments
  // for videos and concert tickets, ranging over the last 36 hours.
  //
  // Example call: curl -X GET http://localhost:4242/calculate-lesson-total
  //
  // Returns a JSON response of the format:
  // {
  //      payment_total: Total before fees and refunds (including disputes), and excluding payments
  //         that haven't yet been captured.
  //      fee_total: Total amount in fees that the store has paid to Stripe
  //      net_total: Total amount the store has collected from payments, minus their fees.
  // }
  //
  apiRouter.get("/calculate-lesson-total", async (req, res) => {
    // TODO: Integrate Stripe
  });

  // Milestone 4: '/find-customers-with-failed-payments'
  // Returns any customer who meets the following conditions:
  // The last attempt to make a payment for that customer failed.
  // The payment method associated with that customer is the same payment method used
  // for the failed payment, in other words, the customer has not yet supplied a new payment method.
  //
  // Example request: curl -X GET http://localhost:4242/find-customers-with-failed-payments
  //
  // Returns a JSON response with information about each customer identified and
  // their associated last payment
  // attempt and, info about the payment method on file.
  // [
  //   {
  //     customer: {
  //       id: customer.id,
  //       email: customer.email,
  //       name: customer.name,
  //     },
  //     payment_intent: {
  //       created: created timestamp for the payment intent
  //       description: description from the payment intent
  //       status: the status of the payment intent
  //       error: the error returned from the payment attempt
  //     },
  //     payment_method: {
  //       last4: last four of the card stored on the customer
  //       brand: brand of the card stored on the customer
  //     }
  //   },
  //   {},
  //   {},
  // ]

  apiRouter.get("/find-customers-with-failed-payments", async (req, res) => {
    // TODO: Integrate Stripe
  });

  return apiRouter;
};
