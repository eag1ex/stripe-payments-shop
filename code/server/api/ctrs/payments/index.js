// @ts-nocheck

/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */

const moment = require('moment')
const { paymentIntentCreateParams } = require("../../../config");
const {cancelCustomerSubscriptions,createSubSchedule}= require('../../../libs/schedules')

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
 * 
 * If a student cancels one or two days before their lesson, we'll capture half of the payment as a late cancellation fee.
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
        error:{
          message: "missing payment_intent_id"
        }
       
      });
    }


    try {

      // check payment status to see if we can do refund or cancel
      const pi = await stripe.paymentIntents.retrieve(payment_intent_id,{expand:['customer']});


      // check if its 1 or 2 days before lesson and if so charge 50% of lesson
      /**
       * @type {CustomerMetadata}
       */
      const metadata= pi.metadata

      // we only want to make sure days match not the exec time
      // is 2 days before lesson
      const isTwoDaysBeforeLesson = moment(Number(metadata.timestamp)).startOf('day').isBefore(moment().subtract(2, 'days').startOf('day'))
      // is one day before lesson
      const isOneDayBeforeLesson = moment(Number(metadata.timestamp)).startOf('day').isBefore(moment().subtract(1, 'days').startOf('day'))



      if(isTwoDaysBeforeLesson || isOneDayBeforeLesson){
        console.log('Number(pi.amount) - (Number(pi.amount)/2',pi.amount,Number(pi.amount) - (Number(pi.amount)/2))

        // if amount received is different and already set use that 
        const amount = !!pi.amount_received ? parseInt(pi.amount_received - (pi.amount_received/2)) :  parseInt(pi.amount - (pi.amount/2));
        if(pi.status === 'requires_capture'){
          await stripe.paymentIntents.capture(
            payment_intent_id,
            { amount_to_capture:amount }
          );
        }
      
        const refund = await stripe.refunds.create({
          amount: amount,
          payment_intent:  pi.id,
        });

        return res.status(200).send({
            refund: refund.id,
            type: "refunded",
          });
      }
  
      // if we 
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
        // if we already canceled this will throw an error
        // should this also check is we are capturing a greater amount than the original payment? ???
        const refundAmount =
          !!amount && pi.amount_capturable !== Number(amount)
            ? Number(amount)
            : -1;

        const refund = await stripe.refunds.create({
          ...(refundAmount !== -1 && { amount: refundAmount }),
          payment_intent: payment_intent_id,
        //  refund_application_fee: true,
        });
        return res.status(200).send({
          refund: refund.id,
          type: "refunded",
        });
      }
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;
      console.error("[refund-lesson][error]", error.message);
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
          error: {
            message: "missing customer_id, amount, or description",
          }
        });
      }

      const piList = (await stripe.paymentIntents.list({ customer: customer_id })).data.filter(n=>(n.status!=='canceled')) 


      if(piList.length){
        return res.status(400).send({
          error: {
            message: `This customer has existing "Payment Intents" with status: ${JSON.stringify(piList.map(n=>n.status))}`,
            payment_intents: piList.map(n=>n.id)
          }
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
        // payment_method_options: {
          
        //   card: {
        //     // so we can capture multiples: https://stripe.com/docs/payments/multicapture
            
        //     request_multicapture: 'if_available',
        //   },
        // },
      });

      const paymentIntentConfirm = await stripe.paymentIntents.confirm(
        piCreate.id,
        { payment_method: "pm_card_visa", capture_method: "manual",setup_future_usage:'off_session'  }
      );

      // create subscription schedule
      await createSubSchedule(stripe, customer.id, 'guitar_lesson',customer.metadata)
  

      return res.status(200).send({
        payment: {
          ...paymentIntentConfirm,
        },
      });
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;

      console.error("[schedule-lesson][error]", error.message);

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
          error: {
            message: "missing payment_intent_id"
          },
        });
      }

      const retrievePayment = await stripe.paymentIntents.retrieve(
        payment_intent_id,
        { expand: ["customer"] }  
      );
     

      let amount_to_capture =
        !!amount && retrievePayment.amount_capturable !== Number(amount)
          ? Number(amount)
          : -1;

      const confirmPayment = await stripe.paymentIntents.capture(
        payment_intent_id,
        { ...(amount_to_capture !== -1 && { amount_to_capture }),
        }
      );

      // cancel subscriptions assigned to this customer
      await cancelCustomerSubscriptions(retrievePayment.customer.id)

      return res.status(200).send({
        payment: confirmPayment,
      });

    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err;
      console.error("[completeLessonPayment][error]", error.message);
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
