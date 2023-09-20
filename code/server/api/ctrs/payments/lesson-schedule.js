/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */


const {baseCurrency} = require('../../../config') 
const {schedulePlanner} = require('../../../utils')

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
    const { customer_id, amount, description } = req.body

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

      const isDay = schedulePlanner(customer.metadata.timestamp,customer.metadata)



      const piFound = (await stripe.paymentIntents.list({ customer: customer_id })).data.filter(n=>n.status==='requires_confirmation')[0]

      if (piFound) {

        const piUpdated = await stripe.paymentIntents.update(piFound.id, {
          amount,
          ...(isDay==='five_days_before' ? { capture_method: 'manual' } : {}),
          setup_future_usage: 'off_session',
          description: description.toString(),
          payment_method: paymentMethod.id,
        })

        if (isDay==='five_days_before') {

          const paymentIntentConfirm = await stripe.paymentIntents.confirm(piUpdated.id, {
            payment_method: 'pm_card_visa',
            capture_method: 'manual',
            setup_future_usage: 'off_session',
          })

          return res.status(200).send({
            message: 'Put a hold (i.e. authorize a pending payment) / updated',
            payment: {
              ...paymentIntentConfirm,
            },
          })
        }

        return res.status(200).send({
          message: isDay==='one_two_days_before' ? 'Put a hold (i.e. authorize a pending payment)'
            :'payment intent updated',
          payment: {
            ...piUpdated,
          },
        })
      }

 
      const piCreate = await stripe.paymentIntents.create({
        currency: baseCurrency,
        payment_method_types: ['card'],
        setup_future_usage: 'off_session',
        ...(isDay==='five_days_before' ? {capture_method:'manual'} : {}),
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

 

      return res.status(200).send({
        message: isDay==='five_days_before' ? 'Put a hold (i.e. authorize a pending payment)': 'payment intent created',
        payment: {
          ...piCreate,
        },
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err

      console.error('[schedule-lesson][error]', error)

      return res.status(400).send({
        error: {
          message: error?.message,
          code: error.code,
        },
      })
    }
  }
