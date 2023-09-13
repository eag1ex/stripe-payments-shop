/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.SetupIntent} StripeSetupIntent */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */

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
      console.log('[GET][getCustomerPaymentMethod][error]', error)
      return res.status(400).send({ ...error })
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
    const { name, email } = req.body
    const { customer_id } = req.params

    try {
      // if we find match and email does not belong to customer_id
      const results = await (async () => {
        let r = (await stripe.customers.search({ query: `email:'${email}'` }))?.data[0]
        if (!!r && r?.id !== customer_id) {
          throw Error(`customer with email: ${email} already exists`)
        }
        // if new email so need get customer object
        // TODO do we need condition for deleted customer ?
        if (!r) r = await stripe.customers.retrieve(customer_id)
        return r
      })()

      console.log('customer_id??', customer_id, results)
      if (!!results && results.id !== customer_id) throw Error(`customer with email: ${email} already exists`)
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
      console.log('[accountUpdate][err]', err)
      res.status(400).send({
        error: { message: error.message, code: error.code },
      })
    }

    // const setupIntent = await stripe.setupIntents.create({
    //   customer: r.id,
    //   metadata: r.metadata,
    // });

    // if (setupIntentSecret) {
    //   stripe.setupIntents.update(setupIntentSecret);
    // }

    // stripe.setupIntents.retrieve;
    // stripe.paymentMethods.detach;

    // stripe.paymentMethods.list({ customer: customer_id });
    // stripe.setupIntents.list({ customer: customer_id });
  }
