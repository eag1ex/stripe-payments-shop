/** @typedef {import('stripe').Stripe.errors} StripeErrors */
/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentIntent} PaymentIntent */
/** @typedef {import('stripe').Stripe.PaymentIntent.Status} PaymentIntentStatus */
/** @typedef {import('../types').Customer.LessonSession} LessonSession */
/** @typedef {import('../types').SchedulePlanner.specificTimeSlots} SpecificTimeSlots */
/** @typedef {import('../types').SchedulePlanner.timeSlots} TimeSlots */


const moment = require('moment')

exports.customerMetadata = ({ type, date, time, timestamp }) => {
  return {
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

/**
 * Time schedule for our payment system
 * @param {Number} _timestamp
 * @param {LessonSession}  session
 * @param {SpecificTimeSlots} specific to only check for specific time, (limited availability)
 * @returns {TimeSlots}
 */
// @ts-ignore
exports.schedulePlanner = (_timestamp, session, specific='') => {
  const timestamp = Number(_timestamp)

  const isBeforeFive = moment(timestamp).isAfter(moment().startOf('day').add(6, 'days'))
  const atFiveDays = moment(timestamp).isBetween(
    moment().startOf('day').add(5, 'days'),
    moment().endOf('day').add(5, 'days').add(5, 'seconds'),
  )
  const lessThenFive = moment(timestamp).isBetween(
    moment().startOf('day').add(3, 'days'),
    moment().endOf('day').add(5, 'days').add(5, 'seconds'),
  )
  const twoToOneDays = moment(timestamp).isBetween(
    moment().startOf('day').add(1, 'days'),
    moment().endOf('day').add(2, 'days').add(1, 'seconds'),
  )
  const isOnDay = moment(timestamp).isBetween(
    moment().startOf('day'),
    moment().endOf('day').add(5, 'seconds'),
  )

  const fiveDaysOrAfter= moment(timestamp).isBefore(moment().endOf('day').add(5, 'days').add(1,'seconds'))

  const tests = [(fiveDaysOrAfter && specific==='five_days_or_after') && 'five_days_or_after',isBeforeFive && 'too_early',atFiveDays && 'five_days_due',lessThenFive && 'less_then_five_days',twoToOneDays &&'one_two_days_due',isOnDay &&'day_of','pass_due']

  const match = tests.filter(n=>!!n)[0]
  console.log('customer is', `${match}`, JSON.stringify(session, null, 2))


  // @ts-ignore
return tests.filter(n=>!!n)[0] ||'pass_due'

}
