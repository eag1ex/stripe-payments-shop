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

    //  customer: Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>


     /**
      * 
      * @returns any
      */
    const deleteCustomer = async (id)=>{
      try{
        let d = await stripe.customers.del(id)
        return d.deleted
      }catch(err){
       console.error('[deleteCustomerAccount][deleteCustomer][error]',id, err)
      }
      return false
    }

    try {


      // customer exists ?
      const isDeleted = await stripe.customers.retrieve(customer_id)
      if(isDeleted.deleted) return res.status(200).send({ deleted: true })

      const piList = await stripe.paymentIntents.list({ customer: customer_id, expand: ['data.customer'] })
      
      if (!piList.data?.length) {
        const del = await deleteCustomer(customer_id)
        return res.status(200).send({ deleted: del })
      }

     
      let piIncomplete = piList.data.filter((n) => (n.status !== 'succeeded' && n.status !== 'canceled') || n.metadata?.type === 'auth_pending_payment')
 
      // check for any auth pending as they do not have charge amount associated with them
      for(let inx = 0; inx < piIncomplete.length; inx++ ){
        let item = piIncomplete[inx]
        if(item.metadata?.type === 'auth_pending_payment' && item.status !== 'canceled') {
          // cancel payment intent
           await stripe.paymentIntents.cancel(item.id)
           piIncomplete.splice(inx,1)
        }
      }

      piIncomplete = piIncomplete.filter((n) =>n.status !== 'canceled')

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
      console.error('[deleteCustomerAccount][error]', error)
      return res.status(400).send({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }

    // stripe.customers.listPaymentMethods(customer_id,{type:'card',expand:['data.customer']})
    // const customer = await stripe.customers.retrieve(customer_id,{expand:['invoice_settings.default_payment_method']})
    // customer.
  }
 // Milestone 3: '/delete-account'
  // Deletes a customer object if there are no uncaptured payment intents for them.
  //
  // Parameters:
  //   customer_id: the id of the customer to delete
  //
  // Example request
  //   curl -X POST http://localhost:4242/delete-account/:customer_id \
  //
  // Returns 1 of 3 responses:
  // If the customer had no uncaptured charges and was successfully deleted returns the response:
  //   {
  //        deleted: true
  //   }
  //
  // If the customer had uncaptured payment intents, return a list of the payment intent ids:
  //   {
  //     uncaptured_payments: ids of any uncaptured payment intents
  //   }
  //
  // If there was an error:
  //  {
  //    error: {
  //        code: e.error.code,
  //        message: e.error.message
  //      }
  //  }
  //





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
