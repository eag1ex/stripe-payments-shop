/** @typedef {import('stripe').Stripe.errors} StripeErrors */

const { resolve } = require("path");
const fs = require("fs");
const {
  customerMetadata,
  customerExists,
  findCustomerSetupIntent,
} = require("../../utils");
const { paymentIntentCreateParams } = require("../../config");

/**
 * API router
 * @param {import('stripe').Stripe} stripe
 * @param {import('express').Router} apiRouter
 * @returns
 */
exports.lessons = (stripe, apiRouter) => {
  //ATTENTION this is confusing, why do we even have this here, react does not generate a page for this, all rendered from index.html
  // Milestone 1: Signing up
  // Shows the lesson sign up page.
  apiRouter.get("/lessons", (req, res) => {
    try {
      console.log("running sessons");
      const path = resolve(`${process.env.STATIC_DIR}/lessons.html`);
      if (!fs.existsSync(path)) throw Error();
      console.log("running sessons2");
      res.sendFile(path);
    } catch (error) {
      const path = resolve("./public/static-file-error.html");
      res.sendFile(path);
    }
  });

  apiRouter.post("/lessons", async (req, res) => {
    try {
      const { learnerEmail, learnerName, metadata, type } = req.body || {};

      console.log("[lessons][body]", req.body);
      if (!learnerEmail || !learnerName)
        return res.status(400).send({
          error: { message: "missing learnerEmail or learnerName" },
        });

      const meta = customerMetadata(metadata || {});
      const cus = await stripe.customers.search({
        query: `email:"${learnerEmail}"`,
        expand: [],
      });

      if (cus.data?.length) {
        const d = cus.data[0];
        return res.send({
          exist: true,
          name: d.name,
          email: d.email,
          customerId: d.id,
        });
      }
      const r = await stripe.customers.create({
        email: learnerEmail,
        name: learnerName,
        metadata: meta,
      });

      // let setupIntent

      // setupIntent = await stripe.setupIntents.create({
      //     customer: r.id,
      //     metadata: meta,
      //     automatic_payment_methods: {
      //         enabled: true,
      //     },
      // });

      if (r.metadata) {
        r.metadata.index = (() => {
          let index;
          if (r.metadata.type === "first_lesson") index = 0;
          if (r.metadata.type === "second_lesson") index = 1;
          if (r.metadata.type === "third_lesson") index = 2;

          return index;
        })();
      }

      const paymentIntent = await stripe.paymentIntents.create({
        ...paymentIntentCreateParams,

        customer: r.id, // one customer only
        confirm: false,
        receipt_email: learnerEmail,
        metadata: r.metadata,
        // automatic_payment_methods: { enabled: true },
      });

      console.log("[GET][lessons][customer]", r);
      console.log("[GET][lessons][paymentIntent]", paymentIntent);

      // the values are confusing, customer object use as customerId
      const secrets = {
        paymentIntent: paymentIntent?.client_secret,
        // setupIntent: setupIntent?.client_secret
      };
      return res.send({
        exist: false,
        secrets,
        customerId: r.id,
        ...(r.metadata ? { metadata: r.metadata } : {}),
        name: r.name,
        email: r.email,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      });
    } catch (error) {
      console.error("[lessons][error]", error);

      res.status(400).send({
        error: {
          message: error.message,
        },
      });
    }
  });

  return apiRouter;
};
