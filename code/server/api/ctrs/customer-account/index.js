/** @typedef {import('stripe').Stripe} Stripe */

/** @typedef {import('stripe').Stripe.SetupIntent} StripeSetupIntent */
/** @typedef {import('stripe').Stripe.PaymentMethod} PaymentMethod */
/** @typedef {import('stripe').Stripe.PaymentIntent.LastPaymentError} LastPaymentError */
/** @typedef {import('stripe').Stripe.PaymentIntent} PaymentIntent */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */

const { EMAIL_REGEX } = require('../../../constants')
const { cusFailedPaymentDto, customerMetadata } = require('../../../utils')
const moment = require('moment')


/**
 * @POST
 * @api /delete-account/:customer_id
 * @param {Stripe} stripe
 */
exports.deleteCustomerAccount =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { customer_id } = req.params

    /**
     *
     * @returns any
     */
    const deleteCustomer = async (id) => {
      try {
        let d = await stripe.customers.del(id)
        return d.deleted
      } catch (err) {
        console.log('[deleteCustomerAccount][deleteCustomer][error]', id, err?.message)
      }
      return false
    }

    try {
      const isDeleted = await stripe.customers.retrieve(customer_id)
      if (isDeleted.deleted) return res.status(200).send({ deleted: true })

      const piList = await stripe.paymentIntents.list({
        customer: customer_id,
        expand: ['data.customer'],
      })

      if (!piList.data?.length) {
        const del = await deleteCustomer(customer_id)
        return res.status(200).send({ deleted: del })
      }

      let piIncomplete = piList.data.filter(
        (n) =>
          n.status !== 'succeeded' &&
          n.status !== 'canceled' &&
          n.metadata?.type === 'lessons-payment',
      )

      // If the student has any uncultured payments, then it returns a list of Payment Intent IDs.
      if (piIncomplete.length) {
        return res.status(200).send({ uncaptured_payments: piIncomplete.map((n) => n.id) })
      }

      const piCompleted = piList.data.filter((n) => n.status === 'succeeded')
      // If the student has completed all of their payments, delete their Customer
      if (piCompleted.length) {
        let deleted = []
        for (const pi of piCompleted) {
          /** @type {StripeCustomer} */
          const customer = pi.customer
          if (typeof customer === 'object') {
            if (customer?.deleted) continue
            const del = await deleteCustomer(customer.id)
            if (del) deleted.push(customer.id)
          }
        }

        if (deleted.length) {
          return res.status(200).send({ deleted: true })
        }
      }

      // no match
      else {
        return res.status(200).send({ deleted: false })
      }
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.error('[deleteCustomerAccount][error]', error.message)
      return res.status(400).send({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }
  }

/**
 * @GET
 * @api /payment-method/:customer_id
 * @param {Stripe} stripe
 */
exports.getCustomerPaymentMethod =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { customer_id } = req.params
    if (!customer_id) return res.status(400).send({ error: { message: 'missing customer_id' } })

    try {
      const customerPayment = (
        await stripe.customers.listPaymentMethods(customer_id, {
          type: 'card',
          expand: ['data.customer'],
        })
      )?.data[0]

      res.status(200).send({
        ...customerPayment,
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[GET][getCustomerPaymentMethod][error]', error.message)
      return res.status(400).send({ error: { message: error.message, code: error.code } })
    }
  }

/**
 *
 * Some of the customer logic is updated via webhook
 * @POST
 * @api /account-update/:customer_id
 * @param {Stripe} stripe
 */
exports.accountUpdate =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    const { email, metadata } = req.body
    const { customer_id } = req.params

    try {

      // if we are only updating metadata
      // we can ignore other steps
      // after user is created during registration process, and we decided to change the booking schedule, we need to update it again
      if(metadata?.timestamp){
        const cus = await stripe.customers.update(customer_id, { metadata })
        return res.status(200).send({ 
          message:'updated customer metadata',
          customer:{
            name: cus.name,
            email: cus.email,
            id: cus.id,
            metadata: cus.metadata
          }
         })
      }

      if (!!email && !EMAIL_REGEX.test(email)) throw Error(`INVALID_EMAIL`)

      // if we find match and email does not belong to customer_id
      const results = await (async () => {
        let r = !!email && (await stripe.customers.search({ query: `email:'${email}'` }))?.data[0]
        if (!!r && r?.id !== customer_id) {
          throw Error(`CUSTOMER_WITH_EMAIL_ALREADY_EXISTS`)
        }
        // if new email so need get customer object
        // TODO do we need condition for deleted customer ?
        if (!r) r = await stripe.customers.retrieve(customer_id)
        return r
      })()

      if (!!results && !!results?.id && results?.id !== customer_id)
        throw Error(`CUSTOMER_WITH_EMAIL_ALREADY_EXISTS`)

      const si = (await stripe.setupIntents.list({ customer: customer_id })).data[0]
      if (!si) throw Error(`setupIntent for customer: ${customer_id} not found`)

      const setupIntent = await stripe.setupIntents.create({
        customer: results.id,
        metadata: results.metadata,
      })

      res.status(200).send({
        secret: {
          setupIntent: setupIntent.client_secret,
        },
        customer: results,
      })
    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[accountUpdate][err]', error.message)

      const code =
        error.message === 'INVALID_EMAIL'
          ? 'INVALID_EMAIL'
          : error.message === 'CUSTOMER_WITH_EMAIL_ALREADY_EXISTS'
          ? 'CUSTOMER_WITH_EMAIL_ALREADY_EXISTS'
          : error.code

      // const message =
      //   error.message === 'INVALID_EMAIL'
      //     ? `Invalid email: ${email}`
      //     : error.message === 'CUSTOMER_WITH_EMAIL_ALREADY_EXISTS'
      //     ? `Customer with email: ${email} already exists`
      //     : error.message

      res.status(400).send({
        error: { message: error.message, code: code },
      })
    }
  }

/**
 * @GET
 * @api /find-customers-with-failed-payments
 * @param {Stripe} stripe
 * @returns
 */
exports.findCustomersWithFailedPayments =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    try {
      const until = {
        created: {
          gte: moment().subtract(36, 'hours').unix(),
        },
      }
      const lessonType = 'lessons-payment' 
      const list = (await stripe.paymentIntents.list({...until})).data.filter(n=>n.metadata?.type === lessonType)
      
  
      const l= list.filter(n=>!!n.last_payment_error)
      

     // if(l.length){
        console.log('[findCustomersWithFailedPayments]', JSON.stringify(l,null,2))
      //}
    

      // Only check the last 36 hours of payments
      const paymentIntents = (
        await stripe.paymentIntents.list({
          ...until,
          expand: ['data.payment_method', 'data.customer'],
        })
      ).data

      // /**
      //  *
      //  * @param {LastPaymentError} last_payment_error
      //  */
      // const issuerDeclined = (last_payment_error) => {
      //   const errMsg = 'issuer_declined'
      //   const customError =
      //     (last_payment_error?.type.includes(errMsg) ||
      //       last_payment_error?.code?.includes(errMsg) ||
      //       last_payment_error?.decline_code?.includes(errMsg) ||
      //       last_payment_error?.message.includes(errMsg)) &&
      //     'issuer_declined'
      //   return customError ? 'issuer_declined' : undefined
      // }

      
      /**
       * from dto() response object
       */
      const results = []

      for (const pi of paymentIntents) {
        if (pi.last_payment_error)  results.push(cusFailedPaymentDto(pi, 'issuer_declined'))
      }


      // initial results with errors
      // now check customers payment method and if it is the same as the failed payment
      if(results.length){
        // for loop
        for(let inx=0; inx<results.length; inx++){
          const r = results[inx]
          
          try{
            // matching payment methods against paymentIntent
            const list = (await stripe.paymentMethods.list({customer:r.customer.id,type:'card'})).data.filter(n=>n.id === r.payment_method.id)
            if(list.length){
              // if there is a match then remove from results
              results.splice(inx, 1)
            }
          }catch(err){
            console.error('[findCustomersWithFailedPayments][paymentMethods][forloop][error]', err.message)
          }
        }
      }  

      // finally remove ids from results
      results.forEach(n=>{
        delete n.payment_method.id
        delete n.payment_intent.id
        delete n.customer.id
      })

      return res.status(200).send(results)

    } catch (err) {
      /** @type {StripeAPIError} */
      const error = err
      console.log('[GET][getCustomerPaymentMethod][error]', error.message)
      return res.status(400).send({ error: { message: error.message, code: error.code } })
    }
  }

// Milestone 4: '/find-customers-with-failed-payments'
// Returns any customer who meets the following conditions:
// The last attempt to make a payment for that customer failed.
// The payment method associated with that customer is the same payment method used
// for the failed payment, in other words, the customer has not yet supplied a new payment method.
//
// Example request: curl -X GET http://localhost:4242/find-customers-with-failed-payments
//
// Returns a JSON response with information about each customer identified and
// their associated last payment
// attempt and, info about the payment method on file.
// [
//   {
//     customer: {
//       id: customer.id,
//       email: customer.email,
//       name: customer.name,
//     },
//     payment_intent: {
//       created: created timestamp for the payment intent
//       description: description from the payment intent
//       status: the status of the payment intent
//        error: the error returned from the payment attempt
//     },
//     payment_method: {
//       last4: last four of the card stored on the customer
//       brand: brand of the card stored on the customer
//     }
//   },
// ]

// https://stripe.com/docs/testing?testing-method=card-numbers#invalid-data
// https://stripe.com/docs/testing?testing-method=card-numbers#declined-payments