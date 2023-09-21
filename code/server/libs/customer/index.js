/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../types').Customer.Metadata} CustomerMetadata */


/**
 * Update customer metadata
 * @param {Stripe} stripe 
 * @param {string} customer_id 
 * @param {CustomerMetadata} metadata
 * @returns {StripeCustomer}
 */
exports.updateCustomerMeta = async (stripe, customer_id, metadata) => {
  try {
    
    const customer = await stripe.customers.update(customer_id, {
      metadata,
    })
    console.log('customer', customer)
    return customer
  } catch (err) {
    console.error('[customer][error', err)
  }
}