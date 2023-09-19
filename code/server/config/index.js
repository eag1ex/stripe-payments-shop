// create Stripe type definitions
/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.ProductCreateParams} ProductCreateParams */
/** @typedef {import('stripe').Stripe.PaymentIntentCreateParams} PaymentIntentCreateParams */
/** @typedef {import('stripe').Stripe.SubscriptionScheduleCreateParams.Phase.Item.PriceData.Recurring} PriceScheduleRecurrence */
/** @typedef {import('stripe').Stripe.ProductCreateParams.DefaultPriceData.Recurring} ProductScheduleRecurrence */

/**
 * @type {PriceScheduleRecurrence | ProductScheduleRecurrence}
 */
exports.scheduleRecurrence = {
  interval: 'week',
  interval_count: 1,
}

/// this always need to change


exports.reportsMarker = process.env.ENV==='TEST' ? 'reports_3445656':null


/** @type {PaymentIntentCreateParams}  */
exports.paymentIntentCreateParams = {
  capture_method: 'manual',
  // default amount we want to charge for lesson
  amount: 50000, // $500.00
  currency: 'usd',
  payment_method_types: ['card'],
  setup_future_usage: 'off_session',
}

/** @type {ProductCreateParams }  */
exports.productOptions = {

}


exports.apiVersion = '2022-11-15'
exports.clientDir = 'build'
