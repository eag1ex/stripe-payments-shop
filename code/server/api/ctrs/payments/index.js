/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */

const moment = require('moment')
const { paymentIntentCreateParams } = require('../../../config')
// const { cancelCustomerSubscriptions, createSubSchedule } = require('../../../libs/schedules')

/**
 * @GET
 * @api /refunds/:refundId
 * @param {Stripe} stripe
 * @returns
 */
exports.lessonRefunds =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { refundId } = req.params
    try {
      const refund = await stripe.refunds.retrieve(refundId)
      return res.status(200).send({
        amount: refund.amount,
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      return res.status(400).send({
        error: {
          message: error.raw?.message,
          code: error.code,
        },
      })
    }
  }

/**
 *
 * If a student cancels one or two days before their lesson, we'll capture half of the payment as a late cancellation fee.
 * @POST
 * @api /refund-lesson
 * @param {Stripe} stripe
 * @returns
 */
exports.refundLesson =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { payment_intent_id, amount } = req.body

    if (!payment_intent_id) {
      return res.status(400).send({
        error: {
          message: 'missing payment_intent_id',
        },
      })
    }

    try {
      // check payment status to see if we can do refund or cancel
      const pi = await stripe.paymentIntents.retrieve(payment_intent_id, { expand: ['customer'] })

      // check if its 1 or 2 days before lesson and if so charge 50% of lesson
      /**
       * @type {CustomerMetadata}
       */
      const metadata = pi.customer.metadata

      // we only want to make sure days match not the exec time
      // is 2 days before lesson
      const atTwoDays = moment(Number(metadata.timestamp))
        .startOf('day')
        .isBefore(moment().subtract(2, 'days').startOf('day'))
      // is one day before lesson
      const isOneDays = moment(Number(metadata.timestamp))
        .startOf('day')
        .isBefore(moment().subtract(1, 'days').startOf('day'))

      // try {
      //   // if there are any created prior we should cancel them
      //   const auth_pending_payment = (await stripe.paymentIntents.list({ customer: pi.customer.id })).data.filter(
      //     (n) => n.metadata?.type === 'auth_pending_payment',
      //   )
      //    // cancel any existing payment intents, and including subscription/type auth_pending_payment
      //    // needed for initial payment hold
      //   if (auth_pending_payment.length) {
      //     for (const n of auth_pending_payment) {
      //       await stripe.paymentIntents.cancel(n.id)
      //     }
      //   }
      // } catch (err) {}

      let refundAmount = (!!amount && !!pi.amount_capturable) && pi.amount_capturable!== Number(amount) ? Number(amount) : pi.amount_capturable || -1

      // refund 50% of lesson
      if (atTwoDays || isOneDays) {
        refundAmount = !!pi.amount_received
          ? parseInt(pi.amount_received - pi.amount_received / 2)
          : parseInt(pi.amount - pi.amount / 2)
        // if we have a payment intent that is requires_capture we need to capture it first
        if (pi.status === 'requires_capture') {
          await stripe.paymentIntents.capture(payment_intent_id, {
            amount_to_capture: refundAmount,
          })
        }
      }

      const refund = await stripe.refunds.create({
        ...(refundAmount !== -1 && { amount: refundAmount }),
        payment_intent: payment_intent_id,
        //  refund_application_fee: true,
      })

      return res.status(200).send({
        refund: refund.id,
        type: 'refunded',
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[refund-lesson][error]', error.message)
      return res.status(400).send({
        error: {
          message: error?.message,
          code: error.code,
        },
      })
    }
  }

//----------------------------------

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

      try {
        
        // because we are using capture_method:manual to be able to set amount_to_capture at /complete-lesson-payment
        // we need to cancel any existing payment intents, that belog to same customer

        const piList = (await stripe.paymentIntents.list({ customer: customer_id })).data.filter(
          (n) => (n.metadata?.type === 'lessons-payment' && n.status === 'requires_capture')
        )
        if (piList.length) {
          for (const n of piList) {
            await stripe.paymentIntents.cancel(n.id)
            console.log('scheduleLesson','paymentIntent canceled', n.id,n.metadata.type, n.status, `cus:${customer_id}`)
          }
        }
      } catch (err) {}

    
      const paymentMethod = (
        await stripe.customers.listPaymentMethods(customer_id, {
          type: 'card',
          expand: ['data.customer'],
        })
      ).data[0]

      /** @type {StripeCustomer} */
      const customer = paymentMethod.customer



      // At 5 days before the scheduled lesson, we'll put a hold (i.e. authorize a pending payment) on the student's card. If this doesn't go through, then we can immediately start booking a new student for our instructor.
      const atFiveDays = moment(Number(customer.metadata.timestamp))
        .startOf('day')
        .isBefore(moment().subtract(5, 'days').startOf('day'))


      if (atFiveDays) {
        console.log('[scheduleLesson][atFiveDays][1]')

        // search customer payment intent
        const pi = (await stripe.paymentIntents.list({ customer: customer.id })).data.filter(
          (n) => n.metadata?.type === 'lessons-payment' && n.status === 'requires_confirmation',
        )[0]

        if (!pi) throw new Error(`No payment intent found, for customer: ${customer_id}, did not go through!`) 

        console.log('[scheduleLesson][atFiveDays][2]')

        const paymentIntentConfirm = await stripe.paymentIntents.confirm(pi.id, {
          payment_method: 'pm_card_visa',
          capture_method: 'manual',
          setup_future_usage: 'off_session',
        })
        console.log('[scheduleLesson][atFiveDays][3]', 'paymentIntentConfirm success')
        return res.status(200).send({
          payment: {
            ...paymentIntentConfirm,
          },
        })
      }

     
      const piCreate = await stripe.paymentIntents.create({
        ...paymentIntentCreateParams,
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

      const paymentIntentConfirm = await stripe.paymentIntents.confirm(piCreate.id, {
        payment_method: 'pm_card_visa',
        capture_method: 'manual',
        setup_future_usage: 'off_session',
      })

      // the requirements for schedule are not very clear so this was created in chase the schedule was ment to be automated ... hmmm
      // await createSubSchedule(stripe, customer.id, 'guitar_lesson',customer.metadata,amount)

      return res.status(200).send({
        payment: {
          ...paymentIntentConfirm,
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

// ----------------------------------

/**
 * @POST
 * @api /complete-lesson-payment
 * @param {Stripe} stripe
 */
exports.completeLessonPayment =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { payment_intent_id, amount } = req.body
    try {
      if (!payment_intent_id) {
        return res.status(400).send({
          error: {
            message: 'missing payment_intent_id',
          },
        })
      }

      const retrievePayment = await stripe.paymentIntents.retrieve(payment_intent_id, {
        expand: ['customer'],
      })

      let amount_to_capture =
        (!!amount && !!retrievePayment.amount_capturable) && retrievePayment.amount_capturable !== Number(amount) ? Number(amount) :retrievePayment.amount_capturable|| -1

      const confirmPayment = await stripe.paymentIntents.capture(retrievePayment.id, {
        ...(amount_to_capture !== -1 && { amount_to_capture }),
      })

      // cancel subscriptions assigned to this customer
      // await cancelCustomerSubscriptions(stripe,retrievePayment.customer.id)

      return res.status(200).send({
        payment: confirmPayment,
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[completeLessonPayment][error]', error.message)
      return res.status(400).send({
        error: {
          message: error?.message,
          code: error.code,
        },
      })
    }
  }
