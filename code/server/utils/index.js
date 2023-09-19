/** @typedef {import('stripe').Stripe.errors} StripeErrors */
/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentIntent} PaymentIntent */
/** @typedef {import('stripe').Stripe.PaymentIntent.Status} PaymentIntentStatus */

exports.customerMetadata = ({ type, date, time, timestamp }) => {
  return {
    // to satisfy stripe's metadata requirements
    first_lesson: date,
    type,
    date,
    time,
    timestamp,
  }
}

exports.delay = (time = 0) => {
  const isNum = typeof time === 'number' && time >= 0 // must provide number
  if (!isNum) return Promise.resolve(true) // or resolve
  // @ts-ignore
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      clearTimeout(t)
      resolve(true)
    }, time)
  })
}

/**
 * @DTO for /find-customers-with-failed-payments
 * @param {PaymentIntent} pi
 * @returns
 */
exports.cusFailedPaymentDto = (pi, error) => {
  try {
    return {
      customer: {
        id: pi.customer.id,
        email: pi.customer.email,
        name: pi.customer.name,
      },
      payment_intent: {
        id: pi.id,
        created: pi.created,
        description: pi.description,
        status: pi.status,
        error: error,
      },
      payment_method: {
        id: pi.payment_method?.id,
        last4: pi.payment_method?.card?.last4,
        brand: pi.payment_method?.card?.brand,
      },
    }
  } catch (err) {
    console.log('[findCustomersWithFailedPayments][dto][error]', err)
    return err
  }
}
