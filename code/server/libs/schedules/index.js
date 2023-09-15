// this is the stripe subscription schedule api

/**
 * @typedef {import('stripe').Stripe} Stripe
 * @typedef {import('../../types').Customer.LessonSession} LessonSession
 */

const { paymentIntentCreateParams, scheduleRecurrence } = require('../../config')
const moment = require('moment')

/**
 *
 * @param {Stripe} stripe
 * @param {*} customerId
 * @param {*} productId
 * @param {LessonSession} metadata
 * @param {string?} description
 * @returns
 */
exports.createSubSchedule = async (stripe, customerId, productId, metadata, description) => {
  try {
    // one subscription per customer
    const sub1 = await (await stripe.subscriptionSchedules.list({ customer: customerId })).data.filter(n=>n.status!=='canceled')
    
    if (sub1.length > 0) {
      throw new Error(`subscription already exists, customer:${customerId} product:${productId}`)
    }
    const test_time = moment().subtract(1, 'days').unix()
    const sub2 = await stripe.subscriptionSchedules.create({
      customer: customerId,
      start_date: test_time, // moment(Number(metadata.timestamp)).unix(),
      end_behavior: 'cancel',
      default_settings:{
        collection_method: 'charge_automatically',
        // to be adjusted >> https://stripe.com/docs/api/subscription_schedules/create#create_subscription_schedule-default_settings-collection_method
        //application_fee_percent
      },
      // expand: ['data.phases'],
      phases: [
        {
          collection_method: 'charge_automatically',
          billing_thresholds: '',
          ...(description && { description }),
          iterations: 12, // run each month for a year
          // end_date:
          currency: 'usd',
          items: [
            {
              price_data: {
                unit_amount: paymentIntentCreateParams.amount,
                currency: 'usd',
                product: productId,
                recurring: {
                  ...scheduleRecurrence,
              
            
                },
              },
              metadata: {
                ...metadata,
              },
              quantity: 1,
            },
          ],
        },
      ],
    })

    console.log('[createSubSchedule]', {
      sub_sched: sub2.id,
      customer: sub2.customer,
      productId: productId,
      amount: paymentIntentCreateParams.amount,
      // startDate: new Date(metadata.timestamp).toISOString(),
    })
    return true
  } catch (err) {
    console.log('[createSubSchedule][error]', err.message)
  }

  return false
}



/**
 * To update an existing we use customer id and product id, each customer can only have one subscription
 * @param {Stripe} stripe
 * @param {*} customerId
 * @param {*} productId
 * @param {number} amount

 */
exports.updateSubSchedule = async (stripe, customerId, productId, amount) => {
  let id
  try {
    const sub1 =( await stripe.subscriptionSchedules.list({ customer: customerId })).data.filter(n=>n.status!=='canceled')

    if (!sub1.length) {
      throw new Error(
        `[updateSubSchedule], no available subscription found for customer:${customerId}, product:${productId}`,
      )
    }

    //REVIEW  there is no business logic on how we should handle multiple subscriptions for a customer
    // SO FOR NOW WE USE THE FIRST ONE
    const sub = sub1[0]
    id = sub.id
    const available = sub.status === 'active' || sub.status === 'not_started'

    if (!available) {
      throw new Error(
        `[updateSubSchedule],status:${sub.status}, not available for customer:${customerId}, product:${productId}`,
      )
    }
  //   "current_phase": {
  //     "end_date": 1697363669,
  //     "start_date": 1694771669
  // },

  // const startEnd = {
  //   ...(sub.status === 'active' && {end_date:sub.current_phase.end_date}),
  //   ...(sub.status === 'not_started' && {start_date:sub.current_phase.start_date}),
  // }
  
    const sub2 = await stripe.subscriptionSchedules.update(sub.id, {
      // end_behavior:'release',
      expand: ['phases'],
      // default_settings:{}, // review do we need set it ?
      phases: [
        {
          // collection_method: 'charge_automatically',
          // billing_thresholds:'',
          //...(description && {description}),
          //  iterations: 12, // run each month for a year
          //   currency:'usd',
          //end_date:'now',
          //   start_date: moment(Number(startDate)).unix(),

          start_date:sub.current_phase.start_date,
          items: [
            {
              price_data: {
                unit_amount: amount,
                currency: 'usd',
                product: productId,
                recurring: {
                  interval: 'month',
                  interval_count: 1,
                },
              },
              quantity: 1,
            },
          ],
        },
      ],
    })

    console.log('[updateSubSchedule]', {
      sub_sched: sub2.id,
      customer: sub2.customer,
      productId: productId,
      amount: amount
    })
    return true
  } catch (err) {
    console.log('[updateSubSchedule][error]',id, err.message)
  }
  return false
}
