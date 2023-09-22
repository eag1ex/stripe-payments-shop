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
    const { payment_intent_id, amount:_amount } = req.body
    const amount = Number(_amount || 0) 
    if (!payment_intent_id) {
      return res.status(400).send({
        error: {
          message: 'missing payment_intent_id',
        },
      })
    }

    let isDay='not_set'
    try {
      // check payment status to see if we can do refund or cancel
      const pi = await stripe.paymentIntents.retrieve(payment_intent_id, { expand: ['customer'] })

     
      /**
       * @type {CustomerMetadata}
       */
      const metadata = pi.customer.metadata
      isDay = schedulePlanner(metadata.timestamp, metadata)
      const five_days_or_after = schedulePlanner(metadata.timestamp, metadata,'five_days_or_after')==='five_days_or_after'
      // const five_days_or_after = schedulePlanner(metadata.timestamp, metadata,'any_day')==='any_day'
      const billable = pi.amount_received
      let refundAmount =amount>0 && amount !== billable ? amount : billable

      // If a student cancels one or two days before their lesson, we'll capture half of the payment as a late cancellation fee.
      // For peace of mind, we would like to manually control each of these steps.
      // >> >> if amount and different amount_received we can set difference
      if (isDay === 'one_two_days_due') {
        refundAmount = amount>0 && amount!==billable? amount: parseInt(billable- billable/ 2)
      }

      // On the morning of the lesson, we capture the payment in full (no refunds if students cancel on the day of).s
      // >>  For peace of mind, we would like to manually control each of these steps.
      // >> >> if amount and different amount_received we can set difference
      if (isDay === 'day_of' || isDay==='pass_due') {
        refundAmount = amount>0 && amount!==billable ? amount: billable
      }

      console.log('trying to refunds.create', {
        amount,
        amount_capturable: pi.amount_capturable,
        pi_amount: pi.amount,
        refundAmount,
        billable
      })

      const refund = await stripe.refunds.create({
        amount: refundAmount,
        payment_intent: payment_intent_id,
        metadata:{
          booking_schedule:isDay,
          ...metadata
        }
        //  refund_application_fee: true,
      })

      return res.status(200).send({
        ...(isDay === 'one_two_days_due'
          ? { message: '[one_two_days_before] Refund 50% of lesson, unless {amount>0} different then amount_received' }
          : isDay === 'day_of' || isDay==='pass_due'
          ? { message: '[day_of][pass_due] No refund, unless {amount>0} different then amount_received' }
          : five_days_or_after
          ? { message: '[five_days_before] Max refund of lesson available' }
          : {}),
        refund: refund.id,
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[refund-lesson][error]', error.message)
      return res.status(400).send({
        ...( isDay==='pass_due' ? { message: '[day_of] No refund, unless {amount>0} different then amount_received' } : {}),
        error: {
          message: error?.message,
          code: error.code,
        },
      })
    }
  }
