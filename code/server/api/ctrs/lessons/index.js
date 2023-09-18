/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */

const { resolve } = require('path')
const fs = require('fs')
const { customerMetadata } = require('../../../utils')

/**
 * @GET
 * @api /lessons/
 * @param {Stripe} stripe
 * @returns
 */
exports.getLessons =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    try {
      const path = resolve(`${process.env.STATIC_DIR}/lessons.html`)
      if (!fs.existsSync(path)) throw Error()
      res.sendFile(path)
    } catch (error) {
      const path = resolve(`${process.env.STATIC_DIR}/static-file-error.html`)
      res.sendFile(path)
    }
  }

/**
 * @POST
 * @api /lessons/
 * @param {Stripe} stripe
 * @returns
 */
exports.postLessons =
  (stripe) =>
  /**
   * @param {Request} req
   * @param {Response} res
   **/
  async (req, res) => {
    try {
      const { learnerEmail, learnerName, metadata, type } = req.body || {}
      if (!learnerEmail || !learnerName)
        return res.status(400).send({
          error: { message: 'missing learnerEmail or learnerName' },
        })

      const meta = customerMetadata(metadata)
      const cus = await stripe.customers.search({
        query: `email:"${learnerEmail}"`,
      })

      if (cus.data?.length) {
        const d = cus.data[0]
        return res.send({
          exist: true,
          name: d.name,
          email: d.email,
          customerId: d.id,
        })
      }

      const r = await stripe.customers.create({
        email: learnerEmail,
        name: learnerName,
        metadata: meta,
      })

      if (r.metadata) {
        // @ts-ignore
        r.metadata.index = (() => {
          let index = 0 
          if (r.metadata.type === 'first_lesson') index = 0
          if (r.metadata.type === 'second_lesson') index = 1
          if (r.metadata.type === 'third_lesson') index = 2
          // we dont support the type: lessons-payment
          return index
        })()
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: r.id,
        metadata: r.metadata,
      })

      // the values are confusing, customer object use as customerId
      const secrets = {
        setupIntent: setupIntent?.client_secret,
      }
      return res.send({
        exist: false,
        secrets,
        customerId: r.id,
        ...(r.metadata ? { metadata: r.metadata } : {}),
        name: r.name,
        email: r.email,
      })
    } catch (error) {
      console.error('[lessons][error]', error)

      res.status(400).send({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }
  }
