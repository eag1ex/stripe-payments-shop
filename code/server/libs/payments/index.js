 /** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentIntent} PaymentIntent */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../types').Customer.Metadata} CustomerMetadata */
/** @typedef {import('../../types').SchedulePlanner.timeSlots} timeSlots */

const {schedulePlanner} = require('../../utils')
 
 
 /**
 * @override
 * Cancel payment intent so we can create a new one for the same customer
 * @param {Stripe} stripe
 * @param {PaymentIntent[]} piList
 * @param {CustomerMetadata} cusMeta
 */
exports.cancelPaymentIntent = async (stripe, piList, cusMeta) => {
  // we need to cancel existing pi with {requires_capture} if customer try to book lesson again
  // we do not have this problem if we use {schedulePlanner} without any_day
  let canceled
  try {
    const existingIntent = piList.filter(
      (n) => n.status === 'requires_capture' && n.metadata?.type === 'lessons-payment',
    )
    for (const pi of existingIntent) {
      // const sch = schedulePlanner(cusMeta.timestamp, cusMeta)
      // if(sch==='day_of' || sch==='pass_due') {
      //   console.warn('scheduleLesson/cancelPaymentIntent', 'Cannot cancel day_of or pass_due for payment_intent_id:', pi.id, 'with customer_id:', customer_id)
      //   continue
      // }
      await stripe.paymentIntents.cancel(pi.id, { cancellation_reason: 'duplicate' })
      console.log('scheduleLesson/cancelPaymentIntent/duplicate', 'Canceled payment_intent_id:', pi.id, 'with customer_id:', pi.customer)
      canceled = true
    }
  } catch (err) {
    console.error('cancelPaymentIntent', err.message)
  }
  return canceled
}
