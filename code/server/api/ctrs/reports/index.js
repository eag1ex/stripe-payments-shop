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
       const charges = (await stripe.charges.list({ ...until,  expand:['data.balance_transaction','data.payment_intent']})).data.filter(n=>n.status==='succeeded' && n.metadata?.type === lessonType)

       console.log('list/charges',JSON.stringify(charges.map(n=>({amount:n.amount, amount_refunded:n.amount_refunded, paid:n.paid, status:n.status, balance_transaction:n.balance_transaction, payment_intent:n.payment_intent})),null,2))

       const paymentTotal = charges.filter(n=>n.paid && n.amount>=0 && n.amount_refunded===0)

       // NOTE balance_transaction.fee currency reflects what card was used, so calculations will be off on local if i selected different country
       const feeTotal = paymentTotal.filter(n=>n.balance_transaction)
       

   
     // const refund_total= refundTotal.reduce((a, b) => a + b.amount_refunded, 0)
      const fee_total = feeTotal.reduce((a, b) => a + b.balance_transaction.fee, 0)
      const payment_total = paymentTotal.reduce((a, b) => a + b.amount, 0)

      const totals = {
        payment_total:payment_total,
        fee_total:fee_total,
        net_total:payment_total-fee_total,
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

