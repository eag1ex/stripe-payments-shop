/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.errors.StripeAPIError} StripeAPIError */
/** @typedef {import('stripe').Stripe.Customer} StripeCustomer */
/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('../../../types').Customer.Metadata} CustomerMetadata */


/**
 * @GET
 * @api /refunds/:refundId
 * @param {Stripe} stripe
 * @returns
 */
exports.lessonRefunded =
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
