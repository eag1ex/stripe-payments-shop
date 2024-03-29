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
  
      const lessonType = 'lessons-payment' 
      // list all charges for lessons
       const charges = (await stripe.charges.list({ ...until,  expand:['data.balance_transaction','data.payment_intent']})).data.filter(n=>n.status==='succeeded' && n.paid && n.metadata?.type === lessonType)

      const balance_transactions = charges.filter(n=>!!n?.balance_transaction && n.balance_transaction?.currency==='usd').map(n=>n.balance_transaction)

     // const amount = charges.reduce((a, b) => a + b.amount, 0)
      const amount_captured = charges.reduce((a, b) => a + b.amount_captured, 0)
      const amount_refunded = charges.reduce((a, b) => a + b.amount_refunded, 0)
      const balance_transactionFees = balance_transactions.reduce((a, b) => a + b.fee, 0)

      // on our account we cannot calculate stripe fees against the same currency, our demo account is in THB unit test account is on USD

      const totals = {
        payment_total:amount_captured,
        fee_total:amount_refunded+balance_transactionFees,
        net_total:amount_captured-amount_refunded-balance_transactionFees,
      }
      return res.status(200).send({...totals})

    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[calculateLessonTotal][error]', error.message)
      return res.status(400).send({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }
  }

