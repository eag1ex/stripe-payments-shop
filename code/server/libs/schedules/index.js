// this is the stripe subscription schedule api

/**
 * @typedef {import('stripe').Stripe} Stripe
 * @typedef {import('../../types').Customer.LessonSession} LessonSession
 */

const { delay } = require('../../utils')
const { paymentIntentCreateParams, scheduleRecurrence } = require('../../config')
const moment = require('moment')
const { v4: uuidv4 } = require('uuid')

/**
 *
 * @param {Stripe} stripe
 * @param {*} customerId
 * @param {*} productId
 * @param {LessonSession} metadata
 * @param {number} amount
 * @returns
 */
exports.createSubSchedule = async (stripe, customerId, productId,metadata, amount) => {
  try {

 
    // offset subscription for testing
    //  const lessonFutureScheduleDate = (()=>{
    //   try{
    //     if(metadata.type==='first_lesson') {
    //       // .format(outputDateFormat).valueOf()
    //      return moment(Number(metadata.timestamp)).subtract(9,'days').unix()
    //      }
    //      if(metadata.type==='second_lesson') {
    //        return moment(Number(metadata.timestamp)).subtract(9+5,'days').unix()
    //      }
    //      if(metadata.type==='third_lesson') {
    //        return moment(Number(metadata.timestamp)).subtract(9+5+7,'days').unix()
    //      }
    //   }catch(err){
    //   }
    
    //  })()

    const uid = uuidv4() 
    const onLessonDay = moment(Number(metadata.timestamp)).unix()
    //   const fiveDaysBeforeLesson = moment(Number(metadata.timestamp)).subtract(5,'days').unix()
    //  const trial_end_test =moment.unix(lessonFutureScheduleDate).add(30,'seconds').unix()
    //   const trial_end_test = moment().add(1,'minute').unix()
    //   const start_date = moment().add(30,'seconds').unix()

    const sub = await stripe.subscriptionSchedules.create({
      
      customer: customerId,
      // start At 5 days before the scheduled lesson,
      start_date:onLessonDay,
      end_behavior: 'cancel',
      default_settings:{
      // billing_cycle_anchor:'phase_start',
        collection_method: 'charge_automatically'
      },
      metadata:{
        ...metadata,
        uid:uid,
      },
      phases: [
        // {
          
        //   //billing_cycle_anchor:'phase_start', 
        //   // trail period should add at start of the subscription {timestamp}
        //   // trial_end:trial_end_test,
        //   end_date:trial_end_test,
        //  // iterations:1,
        //   metadata:{
        //     ...metadata,
        //     message:'no charge, unit price is 0, phase one',
        //     type:'auth_pending_payment',
        //     uid:uid,
        //   },
        //   description:`At 5 days before the scheduled lesson, we'll put a hold (i.e. authorize a pending payment) on the student's card. If this doesn't go through, then we can immediately start booking a new student for our instructor.`,
        //   currency: 'usd',
        //   items: [
        //     {
              
        //       price_data: {
        //         unit_amount: 0,//paymentIntentCreateParams.amount,
        //         currency: 'usd',
        //         product: productId,
        //         recurring: {
        //           interval: 'day',
        //           interval_count: 1,
        //         },
        //       },
        //       metadata: {
        //         ...metadata,
        //         message:'no charge, unit price is 0, phase one',
        //         type:'auth_pending_payment',
        //         uid:uid,
        //       },
        //       quantity: 1,
        //     },
        //   ],
        // },
        {
        collection_method: 'charge_automatically',
         description:`On the morning of the lesson, we capture the payment in full (no refunds if students cancel on the day of schedule)`,
         iterations: 11,
          currency: 'usd',
          metadata:{
            ...metadata,
            type:'invoice_and_charge', 
            uid:uid,
          },
          items: [
            {
              price_data: {
                unit_amount:amount,
                currency: 'usd',
                product: productId,
                recurring: {
                  ...scheduleRecurrence,
                },
              },
              metadata: {
                ...metadata,
                type:'invoice_and_charge',
                uid:uid,
              },
              quantity: 1,
            },
          ],
        },
      ],
    })

    console.log('[createSubSchedule]', {
      uid,
      start_date:moment.unix(start_date).toString(),
      trial_end_test:moment.unix(trial_end_test).toString(),
      sub_sched: sub.id,
      customer: sub.customer,
      productId: productId,
      amount: amount,
    })
    return true
  } catch (err) {
    console.log('[createSubSchedule][error]', err.message)
  }

  return false
}


/**
 * Cancel all subscriptions for a customer
 * @param {Stripe} stripe 
 * @param {*} customerId 

 */
exports.cancelCustomerSubscriptions = async (stripe, customerId) => {

  try {

    const subscriptionSchedule = (await stripe.subscriptionSchedules.list({
      customer: customerId,
    })).data.filter(n=>n.status!=='canceled')

    for (const n of subscriptionSchedule) {
      let c = await stripe.subscriptionSchedules.cancel(n.id)
      console.log('schedule canceled', c.id, c.status, `cus:${customerId}`)
    }
    return true
  } catch (err) {
    console.log('[cancelCustomerSubscriptions][error]', err.message)
  }
  return false
}

/**
 * Delete subscriptions associated with a customer
 * @param {Stripe} stripe
 * @param {*} customerId 
 */
exports.deleteSubscriptions=async (stripe,customerId)=>{
  const subscriptions = await stripe.subscriptions.list({limit:1000})
  console.log('subscriptions',subscriptions.data.length)
  for(const n of subscriptions.data){
   // if(n.status === 'canceled') continue
    let c = await stripe.subscriptions.del(n.id)
    console.log('subscription deleted',c.id, c.status)
    //await delay(100)
  }
}



// /**
//  * To update an existing we use customer id and product id, each customer can only have one subscription
//  * @param {Stripe} stripe
//  * @param {*} scheduleId
//  * @param {*} productId
//  * @param {number} amount

//  */
// exports.updateSubSchedule = async (stripe, scheduleId, productId, amount) => {
//   let id
//   try {
//     // const sub1 =( await stripe.subscriptionSchedules.list({ customer: customerId })).data.filter(n=>n.status!=='canceled')

//     // if (!sub1.length) {
//     //   throw new Error(
//     //     `[updateSubSchedule], no available subscription found for customer:${customerId}, product:${productId}`,
//     //   )
//     // }

//     // //REVIEW  there is no business logic on how we should handle multiple subscriptions for a customer
//     // // SO FOR NOW WE USE THE FIRST ONE
//     // const sub = sub1[0]
//     // id = sub.id
//     // const available = sub.status === 'active' || sub.status === 'not_started'

//     // if (!available) {
//     //   throw new Error(
//     //     `[updateSubSchedule],status:${sub.status}, not available for customer:${customerId}, product:${productId}`,
//     //   )
//     //}
//   //   "current_phase": {
//   //     "end_date": 1697363669,
//   //     "start_date": 1694771669
//   // },

//   // const startEnd = {
//   //   ...(sub.status === 'active' && {end_date:sub.current_phase.end_date}),
//   //   ...(sub.status === 'not_started' && {start_date:sub.current_phase.start_date}),
//   // }
  
//     const sub2 = await stripe.subscriptionSchedules.update(scheduleId, {
//       // end_behavior:'release',
//       // expand: ['phases'],
//       // default_settings:{}, // review do we need set it ?
//       phases: [
//         {
//           // collection_method: 'charge_automatically',
//           // billing_thresholds:'',
//           //...(description && {description}),
//           //  iterations: 12, // run each month for a year
//           //   currency:'usd',
//           //end_date:'now',
//           //   start_date: moment(Number(startDate)).unix(),

//           //start_date:sub.current_phase.start_date,
//           items: [
//             {
//               price_data: {
//                 unit_amount: amount,
//                 currency: 'usd',
//                 product: productId,
//                 recurring: {
//                   interval: 'month',
//                   interval_count: 1,
//                 },
//               },
//               quantity: 1,
//             },
//           ],
//         },
//       ],
//     })

//     console.log('[updateSubSchedule]', {
//       sub_sched: sub2.id,
//       customer: sub2.customer,
//       productId: productId,
//       amount: amount
//     })
//     return true
//   } catch (err) {
//     console.log('[updateSubSchedule][error]',id, err.message)
//   }
//   return false
// }
