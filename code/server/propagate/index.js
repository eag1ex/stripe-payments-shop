// custom propagate actionable scrips
/** @typedef {import('stripe').Stripe} Stripe */

require("dotenv").config({ path: "../.env" });

const { apiVersion, clientDir } = require("../config");
const { delay } = require("../utils");

/** @type {Stripe} */
const Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, { apiVersion });

/**
 *
 * list
 */

function listCustomers() {
  Stripe.customers.list({ limit: 10000 }).then(async (n) => {
    const ids = n.data.map((n) => n.id);
    for (const id of ids) {
      try {
        await Stripe.customers.del(id);
        await delay(100);
        console.log("deleted", id);
      } catch (err) {
        console.log("delete error", id, err);
      }
    }
  });
} //listCustomers()

async function createPriceSession() {
  //   const product = await Stripe.products.create({
  //     name: "Guitar Lesson",
  //     active: true,
  //     //type: "service",

  //     default_price_data: {
  //       currency: "usd",
  //       unit_amount: 500,
  //       //  recurring: { interval: "week", interval_count: 2 },
  //     },
  //   });
  //   console.log("new product created", product);

  //   const price = await Stripe.prices.create({
  //     unit_amount: 500,
  //     currency: "usd",
  //     active: true,

  //     // recurring: { interval: "month" },
  //     product: "prod_ObzYq2T2wUiRt9",
  //   });

  // console.log("new price created", price);
  //
  const session = await Stripe.checkout.sessions.create({
    customer: "cus_ObyNrSSGMiKgJy",
    // setup_intent_data: {
    //   //  application_fee_amount: 123,
    //   //metadata
    //   metadata: { type: "first_lesson" },
    // },
    // customer_email: "jackie123@email.com",
    success_url: "https://example.com/success",

    line_items: [
      {
        price: "price_1Nolb0Do67vHA3BFUWVmxCxq",
        quantity: 1,
      },
    ],
    //expires_at:
    mode: "payment",
  });
  console.log("new session created", session);
}
//createPriceSession();

async function searchPaymentIntent() {
  //  status: 'requires_payment_method',
  try {
    const retrieve = await Stripe.paymentIntents.retrieve(
      "pi_3No3NrDo67vHA3BF2MsnRgKA",
      { expand: ["customer"] }
    );
    console.log("retrieve/paymentIntents", retrieve);
    // const paymentIntent = await Stripe.paymentIntents.search({
    //   // AND status:'succeeded'
    //   //field~value
    //   query: "amount:'500' AND pm:'pm_1No3NuDo67vHA3BFhEVIEbzL'",
    // });

    //console.log("paymentIntent", paymentIntent);
  } catch (err) {
    console.log("err", err.message.toString());
  }
}
//searchPaymentIntent();

async function getCustomer() {
  try {
    const c = await Stripe.customers.retrieve("abc23");
    console.log("customer", c);
  } catch (err) {
    console.log("err.code", err.code);
    console.log("err.message", err.message);
  }
}

//getCustomer();

async function findPayment() {
  //Stripe.customers.retrievePaymentMethod("cus_OcIvXRDpttFPx0");

  const cus = await Stripe.customers.retrieve("cus_OcIvXRDpttFPx0", {
    expand: ["customer"],
  });
  console.log("customer", cus);
}
findPayment();
