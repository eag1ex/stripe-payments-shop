/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */

const { findCustomerSetupIntent } = require("../../utils");
const { paymentIntentCreateParams } = require("../../config");
const e = require("express");
/**
 * API router
 * @param {import('stripe').Stripe} stripe
 * @param {import('express').Router} apiRouter
 * @returns
 */
exports.payments = (stripe, apiRouter) => {
  /**
   * @api lookup https://stripe.com/docs/api/payment_methods/customer_list?lang=node
   */
  apiRouter.get("/payment-method/:customer_id", async (req, res) => {
    const { customer_id } = req.params;

    if (!customer_id)
      return res
        .status(400)
        .send({ error: { message: "missing customer_id" } });

    // if
    console.log("[GET][payment-method][customer]", customer_id);

    try {
      let r;
      // data.payment_method
      const paymentList = (r = (
        await stripe.customers.listPaymentMethods(customer_id, {
          type: "card",
          expand: ["data.customer"],
        })
      )?.data[0]);

      // if no payment exists get customer instead
      if (!paymentList) {
        r = {
          customer: await stripe.customers.retrieve(customer_id),
        };
      }

      res.status(200).send({
        ...r,
      });
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;
      error.raw;
      return res.status(400).send({ error: error.raw });
    }
  });

  // Milestone 2: '/complete-lesson-payment'
  // Capture a payment for a lesson.
  //
  // Parameters:
  // amount: (optional) amount to capture if different than the original amount authorized
  //
  // Example call:
  // curl -X POST http://localhost:4242/api/complete_lesson_payment \
  //  -d payment_intent_id=pi_XXX \
  //  -d amount=4500
  //
  // Returns: a JSON response of one of the following forms:
  //
  // For a successful payment, return the payment intent:
  //   {
  //        payment: <payment_intent>
  //    }
  //
  // for errors:
  //  {
  //    error:
  //       code: the code returned from the error
  //       message: the message returned from the error from Stripe
  // }
  //
  apiRouter.post("/complete-lesson-payment", async (req, res) => {
    const { payment_intent_id, amount } = req.body;
    try {
      if (!payment_intent_id) {
        return res.status(400).send({
          error: true,
          message: "missing payment_intent_id",
        });
      }

      const retrievePayment = await stripe.paymentIntents.retrieve(
        payment_intent_id
      );

      if (retrievePayment.amount !== amount) {
        console.log(
          "[complete-lesson-payment][amount]",
          `param.${amount} does not match payment.${retrievePayment.amount}`
        );
      }
      const confirmPayment = await stripe.paymentIntents.capture(
        payment_intent_id
      );

      return res.status(200).send({
        payment: confirmPayment,
      });
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;

      return res.status(400).send({
        error: {
          message: error.raw?.message,
          code: error.code,
        },
      });
    }
  });

  // Milestone 2: '/schedule-lesson'
  // Authorize a payment for a lesson
  //
  // Parameters:
  // customer_id: id of the customer
  // amount: amount of the lesson in cents
  // description: a description of this lesson
  //
  // Example call:
  // curl -X POST http://localhost:4242/schedule-lesson \
  //  -d customer_id=cus_GlY8vzEaWTFmps \
  //  -d amount=4500 \
  //  -d description='Lesson on Feb 25th'
  //
  // Returns: a JSON response of one of the following forms:
  // For a successful payment, return the Payment Intent:
  //   {
  //        payment: <payment_intent>
  //    }
  //
  // For errors:
  //  {
  //    error:
  //       code: the code returned from the Stripe error if there was one
  //       message: the message returned from the Stripe error. if no payment method was
  //         found for that customer return an msg 'no payment methods found for <customer_id>'
  //    payment_intent_id: if a payment intent was created but not successfully authorized
  // }
  apiRouter.post("/schedule-lesson", async (req, res) => {
    const { customer_id, amount, description } = req.body;

    console.log("[schedule-lesson][body][1]", req.body);

    try {
      if (!customer_id || !amount || !description) {
        return res.status(400).send({
          error: true,
          message: "missing customer_id, amount, or description",
        });
      }

      //---- check if customer exists first
      await stripe.customers.retrieve(customer_id);
      console.log("[schedule-lesson][retrieve][2]", "ok");

      const searchPayment = await stripe.paymentIntents.search({
        query: `amount:'${amount}' AND customer:'${customer_id}' AND status:'requires_capture'`,
      });

      if (!searchPayment.data.length) {
        return res.status(400).send({
          error: true,
          message: "no payment found",
        });
      } else {
        console.log("[schedule-lesson][searchPayment][3]", "ok");

        const paymentId = searchPayment.data[0].id;

        //---- update payment intent description and metadata
        const updatePayment = await stripe.paymentIntents.update(paymentId, {
          description: description.toString(),
          expand: ["customer"],
          metadata: { type: "lessons-payment" },
        });

        console.log("[schedule-lesson][updatePayment][4]", "ok");

        return res.status(200).send({
          payment: {
            ...updatePayment,
          },
        });
      }
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;
      if (error.code === "resource_missing") {
        return res.status(400).send({
          error: {
            message: error.raw?.message,
            code: error.code,
          },
        });
      } else if (error.rawType === "invalid_request_error") {
        if (error.raw?.headers) delete error.raw.headers;
        return res.status(400).send({
          error: {
            ...(error.raw || {}),
          },
        });
      } else {
        return res.status(400).send({
          ...error,
        });
      }
    }
  });

  // TODO: Integrate Stripe

  // Milestone 2: '/refund-lesson'
  // Refunds a lesson payment.  Refund the payment from the customer (or cancel the auth
  // if a payment hasn't occurred).
  // Sets the refund reason to 'requested_by_customer'
  //
  // Parameters:
  // payment_intent_id: the payment intent to refund
  // amount: (optional) amount to refund if different than the original payment
  //
  // Example call:
  // curl -X POST http://localhost:4242/refund-lesson \
  //   -d payment_intent_id=pi_XXX \
  //   -d amount=2500
  //
  // Returns
  // If the refund is successfully created returns a JSON response of the format:
  //
  // {
  //   refund: refund.id
  // }
  //
  // If there was an error:
  //  {
  //    error: {
  //        code: e.error.code,
  //        message: e.error.message
  //      }
  //  }
  apiRouter.post("/refund-lesson", async (req, res) => {
    const { payment_intent_id, amount } = req.body;

    if (!payment_intent_id || !amount) {
      return res.status(400).send({
        error: true,
        message: "missing payment_intent_id, amount",
      });
    }

    try {
      // check payment status to see if we can do refund or cancel
      const pi = await stripe.paymentIntents.retrieve(payment_intent_id);
      const canCancel = [
        "requires_payment_method",
        "requires_capture",
        "requires_confirmation",
        "processing",
      ].includes(pi.status);
      if (canCancel) {
        const paymentIntent = await stripe.paymentIntents.cancel(pi.id);

        return res.status(200).send({
          refund: paymentIntent.id,
          type: "canceled",
        });
      } else {
        const refund = await stripe.refunds.create({
          amount,
          payment_intent: payment_intent_id,
        });
        return res.status(200).send({
          refund: refund.id,
          type: "refunded",
        });
      }
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;

      return res.status(400).send({
        error: {
          message: error.raw?.message,
          code: error.code,
        },
      });
    }
  });

  apiRouter.get("/refunds/:refundId", async (req, res) => {
    const { refundId } = req.params;

    try {
      const refund = await stripe.refunds.retrieve(refundId);
      console.log("[refunds]", refund);
      return res.status(200).send({
        amount: refund.amount,
      });
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;
      return res.status(400).send({
        error: {
          message: error.raw?.message,
          code: error.code,
        },
      });
    }
  });

  return apiRouter;
};
