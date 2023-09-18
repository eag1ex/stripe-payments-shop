/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */

const moment = require('moment')
const { paymentIntentCreateParams } = require('../../../config')
const { cancelCustomerSubscriptions, createSubSchedule } = require('../../../libs/schedules')

/**
 * @GET
 * @api /calculate-lesson-total
 * @param {Stripe} stripe
 * @returns {any}
 */
exports.calculateLessonTotal =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    try {

      const until = {
        created: {
          gte: moment().subtract(36, 'hours').unix(),
        },
      }


      // list all charges
      // this one!!
     // stripe.charges.list({ ...until, expand: ['data.payment_intent'] })

      const paymentTotal = (await stripe.paymentIntents.list({ ...until, expand:['data.charges.data.balance_transaction']})).data.filter(n=>n.status==='succeeded' && n.metadata?.type === 'lessons-payment')
      const feeTotal = paymentTotal.reduce((a, b) => a + b.application_fee_amount, 0)

      // https://stackoverflow.com/questions/62123792/how-can-i-retrieve-the-net-value-of-a-payment-intent-once-ive-stored-it-on-stri

      const payment_total = paymentTotal.reduce((a, b) => a + b.amount, 0)
      const totals = {
        payment_total,
        fee_total:feeTotal,
        net_total:payment_total-feeTotal,
      }

      // {{baseUrl}}/v1/charges?expand[0]=data.payment_intent
      // expect(finalLessonTotalResponse.payment_total).toBe(finalLessonTotalResponse.net_total + finalLessonTotalResponse.fee_total);


       res.status(200).send({
        ...totals
      })

    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.error('[calculateLessonTotal][error]', error)
      return res.status(400).send({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }
  }
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

//   expect(finalLessonTotalResponse.net_total).toBeTruthy();
//   expect(finalLessonTotalResponse.fee_total).toBeTruthy();
//   expect(finalLessonTotalResponse.payment_total).toBeTruthy();

/**
 * @GET
 * @api /find-customers-with-failed-payments
 * @param {Stripe} stripe
 * @returns
 */
exports.findCustomersWithFailedPayments =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {}

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
