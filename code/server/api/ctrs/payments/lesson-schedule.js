/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentIntent} PaymentIntent */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */

const { baseCurrency } = require('../../../config')
const { schedulePlanner } = require('../../../utils')

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

      /**
       * @override
       * Cancel payment intent so we can create a new one for the same customer
       * @param {PaymentIntent[]} piList
       */
      const cancelPaymentIntent = async (piList) => {
        // we need to cancel existing pi with {requires_capture} if customer try to book lesson again
        // we do not have this problem if we use {schedulePlanner} without any_day
        let canceled
        try {
          const existingIntent = piList.filter(
            (n) => n.status === 'requires_capture' && n.metadata?.type === 'lessons-payment',
          )
          for (const pi of existingIntent) {
            await stripe.paymentIntents.cancel(pi.id,{cancellation_reason:'abandoned'})
            canceled = true
          }
        } catch (err) {
          console.error('cancelPaymentIntent', err.message)
        }
        return canceled
      }

      const paymentMethod = (
        await stripe.customers.listPaymentMethods(customer_id, {
          type: 'card',
          expand: ['data.customer'],
        })
      ).data[0]

      let customerIntentsList = (await stripe.paymentIntents.list({ customer: customer_id })).data

      // we need to cancel existing pi with {requires_capture} if customer try to book lesson again
      // NOTE to satisfy unit tests
      const canceled = cancelPaymentIntent(customerIntentsList)


      customerIntentsList = !canceled
        ? customerIntentsList
        : (await stripe.paymentIntents.list({ customer: customer_id })).data

      // check customer previous successful payment intents

      const successfulIntents = customerIntentsList.filter(
        (n) => n.status === 'succeeded' && n.metadata?.type === 'lessons-payment',
      )

      console.log('successfulIntents/list', successfulIntents.length)

      /** @type {StripeCustomer} */
      const customer = paymentMethod.customer

      /**
       * Confirm payment
       * @param {PaymentIntent} pi
       * @returns
       */
      const confirmPayment = async (pi) => {
        return await stripe.paymentIntents.confirm(pi?.id, {
          payment_method: 'pm_card_visa',
          capture_method: 'manual',
          setup_future_usage: 'off_session',
        })
      }

      isDay = schedulePlanner(customer.metadata.timestamp, customer.metadata, 'five_days_or_after')

      five_days_or_after =
        schedulePlanner(customer.metadata.timestamp, customer.metadata, 'five_days_or_after') ===
        'five_days_or_after'

      // five_days_or_after = schedulePlanner(
      //   customer.metadata.timestamp,
      //   customer.metadata,
      //   'any_day',
      // ) === 'any_day'

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
        currency: baseCurrency,
        payment_method_types: ['card'],
        setup_future_usage: 'off_session',
        amount,
        description: description.toString(),
        payment_method: paymentMethod.id,
        metadata: { ...customer.metadata, type: 'lessons-payment' },
        customer: customer.id,
        receipt_email: customer.email,
        // payment_method_options: {
        //   card: {
        //  so we can capture multiples: https://stripe.com/docs/payments/multicapture
        //     request_multicapture: 'if_available',
        //   },
        // },
      })

      pi = await confirmPayment(pi)

      const message = five_days_or_after
        ? '[five_days_or_after] Put a hold (i.e. authorize a pending payment)'
        : canceled
        ? 'Payment intent re/created'
        : 'Payment intent created'

      return res.status(200).send({
        ...(successfulIntents.length>0 ? { recurring_customer: `Returning customer (${successfulIntents.length} x purchases)` } : {}),
        message,
        payment: {
          ...(pi || {}),
        },
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err

      console.error('[schedule-lesson][error]', error)
      return res.status(400).send({
        ...(five_days_or_after
          ? {
              message: `[any_day] Put a hold (i.e. authorize a pending payment), payment_intent_id: ${piId}`,
            }
          : {}),
        error: {
          message: error?.message,
          code: error.code,
        },
      })
    }
  }
