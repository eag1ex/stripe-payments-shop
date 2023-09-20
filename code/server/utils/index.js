/** @typedef {import('stripe').Stripe.errors} StripeErrors */
/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentIntent} PaymentIntent */
/** @typedef {import('stripe').Stripe.PaymentIntent.Status} PaymentIntentStatus */
/** @typedef {import('../types').Customer.LessonSession} LessonSession */

const moment = require("moment");

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
 * 
 * @param {Number} _timestamp 
 * @param {LessonSession?}  session
 * @returns {'one_two_days_before'|'five_days_before'|'day_of'}
 */
exports.schedulePlanner = (_timestamp,session )=>{

  // const timestamp = Number(_timestamp)

  // // if is 5 days before lesson
  // const isFiveDaysBefore = moment(timestamp).isBetween(moment().subtract(5, 'days').startOf('day'), moment().subtract(4, 'days').startOf('day'))
  // if(isFiveDaysBefore){
  //   console.log('customer is 5 days before lesson', JSON.stringify(session,null,2))
  //   return 'five_days_before'
  // }
  // // if is one or two days before lesson
  // const isOneOrTwoDaysBefore = moment(timestamp).isBetween(moment().subtract(2, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day'))

  // if(isOneOrTwoDaysBefore){
  //   console.log('customer is one or two days before lesson',  JSON.stringify(session,null,2))
  //   return 'one_two_days_before'
  // }

  // else {
  //   console.log('customer is day of lesson',  JSON.stringify(session,null,2))
  //   return 'day_of'
  // }
  const timestamp = Number(_timestamp)
  const bookingDay =  moment(timestamp).startOf('day').date()
  const now = moment().startOf('day').date()
  console.log(bookingDay, now)

  if(now+5 ===bookingDay){
    console.log('customer is 5 days before lesson', JSON.stringify(session,null,2))
    return 'five_days_before'
  }
  
  if(bookingDay=== now+2  || now +1===bookingDay){
    console.log('customer is one or two days before lesson',  JSON.stringify(session,null,2))
    return 'one_two_days_before'
  }
  else{
    console.log('customer is day of lesson',  JSON.stringify(session,null,2))
    return 'day_of'}
}
