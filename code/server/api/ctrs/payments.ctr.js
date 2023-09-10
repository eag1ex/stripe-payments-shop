/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */

const { findCustomerSetupIntent } = require("../../utils");
const { paymentIntentCreateParams } = require("../../config");
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
      )?.data[0]); //{customer,card}

      // if no payment exists get customer instead
      if (!paymentList) {
        r = {
          customer: await stripe.customers.retrieve(customer_id),
        };
      }

      // find setupIntent
      let clientSecret;
      let setupIntent;
      const { client_secret } = await findCustomerSetupIntent(
        stripe,
        customer_id
      );

      // if no setupIntent create one
      if (!client_secret) {
        setupIntent = await stripe.setupIntents.create({
          customer: r.customer.id,
          metadata: r.metadata,
          automatic_payment_methods: {
            enabled: true,
          },
        });
      }

      clientSecret = client_secret || setupIntent?.client_secret;

      res.status(200).send({
        ...r,
        clientSecret,
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
  apiRouter.post("/complete-lesson-payment", async (req, res) => {});

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
          message: "missing customer_id, amount or description",
        });
      }

      const searchPayment = await stripe.paymentIntents.search({
        query: `amount:'${amount}' AND customer:'${customer_id}' AND status:'requires_capture'`,
      });

      if (!searchPayment.data.length) {
        return res.status(400).send({
          error: true,
          message: "no payment found",
        });
      } else {
        const paymentId = searchPayment.data[0].id;

        const updatePayment = await stripe.paymentIntents.update(paymentId, {
          description: description.toString(),
          expand: ["customer"],
          //   capture_method: paymentIntentCreateParams.capture_method,
          metadata: { type: "lessons-payment" },
        });

        // const confirmPayment = await stripe.paymentIntents.confirm(
        //   updatePayment.id,
        //   {
        //     payment_method: "pm_card_visa",
        //   }
        // );

        // console.log(
        //   "[schedule-lesson][updatePayment][3]",
        //   JSON.stringify(updatePayment)
        // );

        return res.status(200).send({
          ...updatePayment,
        });

        // const paymentIntent = await stripe.paymentIntents.confirm(
        //   updatePayment.id,
        //   customer_id
        //   { payment_method: "pm_card_visa" }
        // );
      }

      // TODO: FOLLOW THIS
      // https://stripe.com/docs/api/payment_intents/retrieve
      // https://stripe.com/docs/api/payment_intents/confirm
      // REFUND https://stripe.com/docs/refunds?dashboard-or-api=api
      //     const session = await stripe.checkout.sessions.create({
      //       success_url: "https://example.com/success",
      //       line_items: [{ price: "price_H5ggYwtDq4fbrJ", quantity: 1 }],
      //       mode: "payment",
      // });
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;

      return res.status(400).send({
        error: error.raw,
        payment_intent_id: error.payment_intent?.id,
      });
    }
  });

  return apiRouter;
};
