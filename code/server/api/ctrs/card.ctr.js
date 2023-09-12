/**
 * API router
 * @param {import('stripe').Stripe} stripe
 * @param {import('express').Router} apiRouter
 * @returns
 */
exports.card = (stripe, apiRouter) => {
  /**
   * @api lookup https://stripe.com/docs/api/payment_methods/customer_list?lang=node
   * @description get payment method details
   * - This api was added as the milestone one is inconclusive, you cannot retrieve last4 from `setupIntents to stripe.confirmCardSetup on client side, unless creating paymentIntent
   * - the mile stone asks the save card details first for later use.
   *
   */
  apiRouter.get("/card/:payment_method", async (req, res) => {
    const { payment_method } = req.params;

    if (!payment_method)
      return res
        .status(400)
        .send({ error: { message: "missing payment_method" } });

    try {
      const pm = await stripe.paymentMethods.retrieve(payment_method, {
        expand: ["customer"],
      });
      res.status(200).send({
        ...pm,
      });
    } catch (err) {
      console.error("[card/:payment_method]", err);
      res.status(500).send({
        error: true,
        message: err.message,
      });
    }
  });

  return apiRouter;
};
