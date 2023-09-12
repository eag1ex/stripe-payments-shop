// @ts-nocheck

/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */

const { paymentIntentCreateParams } = require("../../../config");

/**
 * @GET
 * @api /refunds/:refundId
 * @param {Stripe} stripe
 * @returns
 */
exports.lessonRefunds =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
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
  };

/**
 * @POST
 * @api /refund-lesson
 * @param {Stripe} stripe
 * @returns
 */
exports.refundLesson =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { payment_intent_id, amount } = req.body;

    if (!payment_intent_id) {
      return res.status(400).send({
        error: true,
        message: "missing payment_intent_id",
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
        let refundAmount =
          !!amount && pi.amount_capturable !== Number(amount)
            ? Number(amount)
            : -1;

        const refund = await stripe.refunds.create({
          ...(refundAmount !== -1 && { amount: refundAmount }),
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
      console.error("[refund-lesson][error]", error);
      return res.status(400).send({
        error: {
          message: error.raw?.message,
          code: error.code,
        },
      });
    }
  };

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

//----------------------------------

/**
 * @POST
 * @api /schedule-lesson
 * @param {Stripe} stripe
 * @returns
 */
exports.scheduleLesson =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { customer_id, amount, description } = req.body;

    try {
      if (!customer_id || !amount || !description) {
        return res.status(400).send({
          error: true,
          message: "missing customer_id, amount, or description",
        });
      }

      const paymentMethod = (
        await stripe.customers.listPaymentMethods(customer_id, {
          type: "card",
          expand: ["data.customer"],
        })
      ).data[0];

      /** @type {StripeCustomer} */
      const customer = paymentMethod.customer;

      const piCreate = await stripe.paymentIntents.create({
        ...paymentIntentCreateParams,
        amount,
        description: description.toString(),
        payment_method: paymentMethod.id,
        metadata: { ...customer.metadata },
        customer: customer.id,
        receipt_email: customer.email,
      });

      // if not set the status will be 'requires_confirmation'
      const paymentIntentConfirm = await stripe.paymentIntents.confirm(
        piCreate.id,
        { payment_method: "pm_card_visa", capture_method: "manual" }
      );

      return res.status(200).send({
        payment: {
          ...paymentIntentConfirm,
        },
      });
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;

      console.error("[schedule-lesson][error]", error);

      return res.status(400).send({
        error: {
          message: error.raw?.message,
          code: error.code,
        },
      });
    }
  };

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

// ----------------------------------

/**
 * @GET
 * @api /payment-method/:customer_id
 * @param {Stripe} stripe
 */
exports.customerPaymentMethod =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { customer_id } = req.params;

    if (!customer_id)
      return res
        .status(400)
        .send({ error: { message: "missing customer_id" } });

    try {
      let r;
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
      console.log("[GET][payment-method][error]", error);
      return res.status(400).send({ ...error });
    }
  };

// ----------------------------------

/**
 * @POST
 * @api /complete-lesson-payment
 * @param {Stripe} stripe
 */
exports.completeLessonPayment =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
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

      let amount_to_capture =
        !!amount && retrievePayment.amount_capturable !== Number(amount)
          ? Number(amount)
          : -1;

      const confirmPayment = await stripe.paymentIntents.capture(
        payment_intent_id,
        { ...(amount_to_capture !== -1 && { amount_to_capture }) }
      );

      return res.status(200).send({
        payment: confirmPayment,
      });
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;
      console.error("[completeLessonPayment][error]", error);
      return res.status(400).send({
        error: {
          message: error.raw?.message || "generic_error_check_logs",
          code: error.code,
        },
      });
    }
  };

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

// ----------------------------------
