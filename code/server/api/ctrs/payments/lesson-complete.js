/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */

const moment = require('moment')
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
    const { payment_intent_id, amount } = req.body
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

      console.log('[completeLessonPayment][pi] 1')
      /**
       * @type {CustomerMetadata}
       */
      const metadata = pi.customer.metadata
      const isDay = schedulePlanner(metadata.timestamp, metadata)

      let status = pi.status
      let latestPi = (pi =
        status === 'requires_confirmation'
          ? await stripe.paymentIntents.confirm(payment_intent_id, {
              payment_method: 'pm_card_visa',
              capture_method: 'manual',
              setup_future_usage: 'off_session',
              expand: ['customer'],
            })
          : pi)

      status = latestPi.status

      let amount_to_capture = Number(amount) > 0 ? Number(amount) : latestPi.amount_capturable

      if (isDay === 'five_days_before') {

        latestPi =
          status === 'requires_capture'
            ? await stripe.paymentIntents.capture(latestPi.id, {
                amount_to_capture,
              })
            : latestPi
      }

      if (isDay === 'day_of') {
        amount_to_capture = Number(amount) >0 ? Number(amount) : latestPi.amount
      }

      // On the morning of the lesson, we capture the payment in full (no refunds if students cancel on the day of) schedule
      if (isDay === 'one_two_days_before') {
        latestPi =
          status === 'requires_confirmation'
            ? await stripe.paymentIntents.confirm(latestPi.id, {
                payment_method: 'pm_card_visa',
                capture_method: 'manual',
                setup_future_usage: 'off_session',
              })
            : latestPi

        amount_to_capture = Number(amount) > 0 ? Number(amount) : parseInt(latestPi.amount - latestPi.amount / 2)
      }

      latestPi = latestPi || pi

      // the is lesson is already confirmed at 5 days before
      if (isDay !== 'five_days_before') {
        // complete lesson outside of schedule
        latestPi =
          status === 'requires_confirmation'
            ? await stripe.paymentIntents.confirm(latestPi.id, {
                payment_method: 'pm_card_visa',
                capture_method: 'manual',
                setup_future_usage: 'off_session',
              })
            : latestPi
      }


      latestPi = latestPi || pi

      latestPi = await stripe.paymentIntents.capture(latestPi.id, {
        amount_to_capture: amount_to_capture,
      })


      // 'payment confirmed and captured, outside of schedule',
      return res.status(200).send({
        message: isDay ==='day_of' ? '[day_of] Capture full payment' :  isDay ==='five_days_before' ? '[five_days_before] Capture full/partial payment': isDay==='one_two_days_before' ? '[one_two_days_before] Capture 50% payment' : 'payment confirmed and captured, outside of schedule',
        payment: latestPi,
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
