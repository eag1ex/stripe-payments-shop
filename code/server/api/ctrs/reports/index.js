/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */

const moment = require('moment')


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

      const paymentTotal = (await stripe.paymentIntents.list({ ...until, expand:['data.charges.data.balance_transaction']})).data.filter(n=>n.status==='succeeded' && n.metadata?.type === 'lessons-payment' )

     const refundTotal = (await stripe.refunds.list({ ...until, expand:['data.payment_intent']})).data.filter(n=>n.status==='succeeded' && n.payment_intent?.metadata?.type === 'lessons-payment')


      const refund_total= refundTotal.reduce((a, b) => a + b.amount, 0)
      const feeTotal = (paymentTotal.reduce((a, b) => a + b.application_fee_amount, 0)) + refund_total
      const payment_total = paymentTotal.reduce((a, b) => a + b.amount, 0)
      const totals = {
        payment_total,
        fee_total:feeTotal,
        net_total:payment_total-feeTotal,
      }
      return res.status(200).send({...totals})

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

