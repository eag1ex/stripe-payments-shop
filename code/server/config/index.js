// create Stripe type definitions
/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentIntentCreateParams} PaymentIntentCreateParams */

/** @type {PaymentIntentCreateParams}  */
const paymentIntentCreateParams = {
  capture_method: 'manual',
  amount: 500,
  currency: 'usd',
  payment_method_types: ['card'],
  setup_future_usage: 'off_session',
}

exports.paymentIntentCreateParams = paymentIntentCreateParams
exports.apiVersion = '2022-11-15'
exports.clientDir = 'build'
