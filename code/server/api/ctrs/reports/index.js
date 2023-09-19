/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */

const moment = require('moment')
const { delay } = require('../../../utils')

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

      // list payment intent application fees for lessons 
      const list = (await stripe.paymentIntents.list({ ...until, expand:['data.charges.data.balance_transaction']})).data

      console.log('calculateLessonTotal/list/fees',list.map(n=>({application_fee_amount:n.application_fee_amount, amount_received:n.amount_received, amount:n.amount, status:n.status}) ))
     


      const paymentTotal = list.filter(n=>n.status==='succeeded' && n.metadata?.type === 'lessons-payment' )
      const piIds= paymentTotal.map(n=>n.id)

     const refundTotal = (await stripe.refunds.list({ ...until, expand:['data.payment_intent']})).data.filter(n=>n.status==='succeeded' && n.payment_intent?.metadata?.type === 'lessons-payment' && piIds.includes(n.payment_intent.id) && n.payment_intent.amount_received===n.amount)


      const refund_total= refundTotal.reduce((a, b) => a + b.amount, 0)
      const feeTotal = (paymentTotal.reduce((a, b) => a + b.application_fee_amount, 0)) + refund_total

      const payment_total = paymentTotal.reduce((a, b) => a + b.amount, 0)
  console.log('feeTotal ', payment_total,feeTotal)
      const totals = {
        payment_total,
        fee_total:feeTotal,
        net_total:payment_total-feeTotal,
      }
      return res.status(200).send({...totals})

    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[calculateLessonTotal][error]', error)
      return res.status(400).send({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }
  }

