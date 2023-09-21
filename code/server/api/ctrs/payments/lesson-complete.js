/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */


const { schedulePlanner } = require('../../../utils')
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
    const { payment_intent_id, amount: _amount } = req.body
    const amount = Number(_amount || 0)

    try {
      if (!payment_intent_id) {
        return res.status(400).send({
          error: {
            message: 'missing payment_intent_id',
          },
        })
      }

      let pi = await stripe.paymentIntents.retrieve(payment_intent_id, {
        expand: ['customer'],
      })

      /**
       * @type {CustomerMetadata}
       */
      const metadata = pi.customer.metadata; // we are not updating payment intent frequently in case we have to change date to speedup transaction for testing :))
      const isDay = schedulePlanner(metadata.timestamp, metadata,'any_day')
     // const five_days_or_after = schedulePlanner(metadata.timestamp, metadata, 'five_days_or_after') ==='five_days_or_after'
      const five_days_or_after = schedulePlanner(metadata.timestamp, metadata, 'any_day') ==='any_day'

      let status = pi.status
      // initial setting to complete the payment prior 5 days
      const validAmount = pi.amount_capturable  || pi.amount
      let amount_to_capture = amount > 0 && amount !== validAmount ? amount : validAmount

      // On the morning of the lesson, we capture the payment in full (no refunds if students cancel on the day of).s
      // >> we would like to manually control each of these steps. <<

      pi =
        status === 'requires_confirmation'
          ? await stripe.paymentIntents.confirm(pi.id, {
              payment_method: 'pm_card_visa',
              capture_method: 'manual',
              setup_future_usage: 'off_session',
            })
          : pi

      // the tricky part, we can only capture payment when it is 5 days in or less      
      // if (isDay === 'one_two_days_due') {
      //   const validAmount = pi.amount_capturable  || pi.amount
      //   amount_to_capture = amount > 0 && amount !== validAmount ? amount : parseInt(validAmount/2 )
      // }  

      // capture full amount which ever captured first or the full amount, or manual entry
      // if (isDay === 'day_of' || isDay === 'pass_due') {
      //   const validAmount = pi.amount_capturable  || pi.amount
      //   amount_to_capture = amount > 0 && amount !== validAmount ? amount : validAmount
      // }

      console.log('trying to amount_to_capture', {
        amount,
        amount_capturable: pi.amount_capturable,
        pi_amount: pi.amount,
        amount_to_capture
      })

      pi = await stripe.paymentIntents.capture(pi.id, {
        amount_to_capture: amount_to_capture,
      })

      // 'payment confirmed and captured, outside of schedule',
      return res.status(200).send({
        // message:
        //   isDay === 'day_of' || isDay === 'pass_due'
        //     ? '[day_of] Capture full payment, or {amount>0}'
        //     : five_days_or_after
        //     ? '[five_days_or_after] Capture full/partial payment, or {amount>0}'
        //     : isDay === 'one_two_days_due'
        //     ? '[one_two_days_before] When cancel capture 50% payment, or {amount>0}'
        //     : 'Payment confirmed and captured, outside of schedule',
        payment: pi,
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[completeLessonPayment][error]', error.message)
      return res.status(400).send({
        error: {
          message: error?.message,
          code: error.code,
        },
      })
    }
  }
