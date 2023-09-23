/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentIntent} PaymentIntent */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */
/** @typedef {import('../../../types').SchedulePlanner.timeSlots} timeSlots */

const { baseCurrency } = require('../../../config')
const { schedulePlanner,timeSlotMessage } = require('../../../utils')
const {cancelPaymentIntent} = require('../../../libs/payments')
/**
 * @POST
 * @api /schedule-lesson
 * @param {Stripe} stripe
 * @returns
 */
exports.scheduleLesson =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { customer_id, amount: _amount, description } = req.body
    const amount = Number(_amount||0)

    let five_days_or_after
    let isDay
    let piId
    try {
      if (!customer_id || !amount || !description) {
        return res.status(400).send({
          error: {
            message: 'missing customer_id, amount, or description',
          },
        })
      }

      
      const paymentMethod = (
        await stripe.customers.listPaymentMethods(customer_id, {
          type: 'card',
          expand: ['data.customer'],
        })
      ).data[0]


      /** @type {StripeCustomer} */
      const customer = paymentMethod.customer

      let customerIntentsList = (await stripe.paymentIntents.list({ customer: customer_id })).data
  
      // we need to cancel existing pi with {requires_capture} if customer try to book lesson again
      // NOTE to satisfy unit tests
      const canceled = await cancelPaymentIntent(stripe,customerIntentsList,customer.metadata)
      customerIntentsList = !canceled
        ? customerIntentsList
        : (await stripe.paymentIntents.list({ customer: customer_id })).data

      // check customer previous successful payment intents
      const successfulIntents = customerIntentsList.filter(
        (n) => n.status === 'succeeded' && n.metadata?.type === 'lessons-payment',
      )

 
      // /**
      //  * Confirm payment
      //  * @param {PaymentIntent} pi
      //  * @returns
      //  */
      // const confirmPayment = async (pi) => {
      //   return await stripe.paymentIntents.confirm(pi?.id, {
          
      //     payment_method: 'pm_card_visa',
      //     capture_method: 'manual',
      //     setup_future_usage: 'off_session',
      //     error_on_requires_action:true,
      //   })
      // }

      isDay = schedulePlanner(customer.metadata.timestamp, customer.metadata)

      five_days_or_after =
        schedulePlanner(customer.metadata.timestamp, customer.metadata, 'five_days_or_after') ===
        'five_days_or_after'

      let pi = customerIntentsList
        .filter(
          (n) => n.status !== 'canceled' && n.status !== 'succeeded' && n.status !== 'processing',
        )
        .filter((n) =>
          n.status === five_days_or_after ? 'requires_capture' : 'requires_confirmation',
        )[0]
      piId = pi?.id

      pi = await stripe.paymentIntents.create({
        
        capture_method: 'manual',
        confirmation_method:'manual',
        error_on_requires_action:true,
        confirm: true,
        currency: baseCurrency,
        payment_method_types: ['card'],
        setup_future_usage: 'off_session',
        amount,
        description: description.toString(),
        payment_method: paymentMethod.id,
        metadata: { 
          booking_schedule: isDay,
          ...customer.metadata, type: 'lessons-payment' },
        customer: customer.id,
        receipt_email: customer.email,
        // payment_method_options: {
        //   card: {
        //  so we can capture multiples: https://stripe.com/docs/payments/multicapture
        //     request_multicapture: 'if_available',
        //   },
        // },
      })

    //  console.log('pi/id',pi.id)
    //   pi = await confirmPayment(pi)


      return res.status(200).send({
        ...(successfulIntents.length > 0
          ? { recurring_customer: `Returning customer (${successfulIntents.length} x purchases)` }
          : {}),
        message:timeSlotMessage(isDay,canceled),
        payment: {
          ...(pi || {}),
        },
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err

      console.error('[schedule-lesson][error]', error.message)
      return res.status(400).send({
        ...(isDay==='day_of' || isDay==='pass_due'
          ? {
              message: `[pass_due][day_of] No refunds if students cancel on the day of, payment_intent_id: ${piId}`,
            }
          : {}),
        error: {
          message: error?.message,
          code: error.code,
        },
      })
    }
  }
