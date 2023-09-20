/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */

const { schedulePlanner } = require('../../../utils')
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
    const { payment_intent_id, amount } = req.body

    if (!payment_intent_id) {
      return res.status(400).send({
        error: {
          message: 'missing payment_intent_id',
        },
      })
    }

    try {
      // check payment status to see if we can do refund or cancel
      const pi = await stripe.paymentIntents.retrieve(payment_intent_id, { expand: ['customer'] })

      /**
       * @type {CustomerMetadata}
       */
      const metadata = pi.customer.metadata
      const isDay = schedulePlanner(metadata.timestamp, metadata)

      let refundAmount =
        !!Number(amount) && Number(amount) !== pi.amount_received
          ? Number(amount)
          : pi.amount_received

      if (isDay === 'one_two_days_before') {

        refundAmount = Number(amount)>0 ? Number(amount): parseInt(pi.amount - pi.amount/ 2)
          // pi.amount_received > 0
          //   ? parseInt(pi.amount_received - pi.amount_received / 2)
          //   : parseInt(pi.amount - pi.amount / 2) || -1
      }

      if (isDay === 'day_of') {
        refundAmount = Number(amount)>0 ? Number(amount) : pi.amount
      }
      console.log('refund is',refundAmount,pi.amount_received )
      const refund = await stripe.refunds.create({
        amount: refundAmount,
        payment_intent: payment_intent_id,
        //  refund_application_fee: true,
      })
     

      return res.status(200).send({
        ...(isDay === 'one_two_days_before'
          ? { message: '[one_two_days_before] Refund 50% of lesson' }
          : isDay === 'day_of'
          ? { message: '[day_of] Full refund available' }
          : isDay === 'five_days_before'
          ? { message: '[five_days_before] Any refund of lesson available' }
          : {}),
        refund: refund.id,
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[refund-lesson][error]', error.message)
      return res.status(400).send({
        error: {
          message: error?.message,
          code: error.code,
        },
      })
    }
  }
