/** @typedef {import('stripe').Stripe} Stripe */

/** @typedef {import('stripe').Stripe.SetupIntent} StripeSetupIntent */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */

const { EMAIL_REGEX } = require('../../../constants')

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
    const deleteCustomer = async (id)=>{
      try{
        let d = await stripe.customers.del(id)
        return d.deleted
      }catch(err){
       console.error('[deleteCustomerAccount][deleteCustomer][error]',id, err?.message)
      }
      return false
    }

    try {

      const isDeleted = await stripe.customers.retrieve(customer_id)
      if(isDeleted.deleted) return res.status(200).send({ deleted: true })

      const piList = await stripe.paymentIntents.list({ customer: customer_id, expand: ['data.customer'] })
      
      if (!piList.data?.length) {
        const del = await deleteCustomer(customer_id)
        return res.status(200).send({ deleted: del })
      }

     
      let piIncomplete = piList.data.filter((n) => (n.status !== 'succeeded' && n.status !== 'canceled'))
 

      // If the student has any uncultured payments, then it returns a list of Payment Intent IDs.
      if(piIncomplete.length){
        return res.status(200).send({uncaptured_payments:piIncomplete.map(n=>n.id)})
      }

      const piCompleted = piList.data.filter((n) => n.status === 'succeeded')
      // If the student has completed all of their payments, delete their Customer
      if(piCompleted.length){

        let deleted = []
        for(const pi of piCompleted){
          /** @type {StripeCustomer} */
          const customer = pi.customer
          if(typeof customer ==='object') {
            if(customer?.deleted) continue
            const del = await deleteCustomer(customer.id)
            if(del) deleted.push(customer.id)
          }
        }

        if(deleted.length){
          return res.status(200).send({deleted:true})
        }
      }

      // no match 
      else{
        return res.status(200).send({deleted:false})
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
      console.error('[GET][getCustomerPaymentMethod][error]', error.message)
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
    const { email } = req.body
    const { customer_id } = req.params

    try {
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

      if ((!!results && !!results?.id) && results?.id !== customer_id) throw Error(`CUSTOMER_WITH_EMAIL_ALREADY_EXISTS`)

      const si = (await stripe.setupIntents.list({ customer: customer_id })).data[0]
      if (!si) throw Error(`setupIntent for customer: ${customer_id} not found`)

      // if (!!name || !!email)
      //   await stripe.customers.update(customer_id, {
      //     ...(!!name && { name }),
      //     ...(!!email && { email }),
      //   })

      // i think we done need to update the payment method here as it gets in the way of the setupIntent
      // const pmId = typeof si.payment_method === 'string' ? si.payment_method : si.payment_method.id
      // await stripe.paymentMethods.update(pmId, {
      //   billing_details: {
      //     name,
      //     email,
      //   },
      // })

      // update should provide new client_secret if we are updating the payment_method there after
      // const { client_secret, customer, payment_method } = await stripe.setupIntents.retrieve(si.id, {
      //   expand: ['payment_method', 'customer'],
      // })

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
