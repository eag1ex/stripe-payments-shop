// custom propagate actionable scrips
/** @typedef {import('stripe').Stripe} Stripe */

require("dotenv").config({ path: "../.env" });

const moment = require("moment");
const { apiVersion, clientDir } = require("../config");
const { delay } = require("../utils");

/** @type {Stripe} */
const Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, { apiVersion });

/**
 *
 * list
 */

function listCustomersDelete() {
  Stripe.customers.list({ limit: 10000 }).then(async (n) => {
    const ids = n.data.map((n) => n.id);
    for (const id of ids) {
      try {
        await Stripe.customers.del(id);
        await delay(50);
        console.log("deleted", id);
      } catch (err) {
        console.log("delete error", id, err);
      }
    }
  });
} //

//listCustomersDelete();

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
    // const retrieve = await Stripe.paymentIntents.retrieve(
    //   "pi_3No3NrDo67vHA3BF2MsnRgKA",
    //   { expand: ["customer"] }
    // );
    // console.log("retrieve/paymentIntents", retrieve);
    // const paymentIntent = await Stripe.paymentIntents.search({
    //   // AND status:'succeeded'
    //   //field~value
    //   query: "amount:'500' AND pm:'pm_1No3NuDo67vHA3BFhEVIEbzL'",
    // });

    const pi = (
      await Stripe.paymentIntents.list({ customer: "cus_Ocebh60mKHMsrX" })
    ).data;
    // .filter((n) => {
    //   n.status === "requires_confirmation";
    // })[0];

    //console.log("paymentIntent/list", pi);
  } catch (err) {
    console.log("err", err.message.toString());
  }
}
//searchPaymentIntent();

async function getCustomer() {
  // try {
  //   const c = await Stripe.customers.retrieve("abc23");
  //   console.log("customer", c);
  // } catch (err) {
  //   console.log("err.code", err.code);
  //   console.log("err.message", err.message);
  // }

  const c = await Stripe.customers.search({
    query: `email:'johndoe123@email.com'`,
  });
  console.log("customer", c);
}

//getCustomer();

async function searchCustomer() {
  //  AND status:'requires_confirmation'
  const customer = `cus_Oce96XbH00AWfM`;
  const searchPayment = await Stripe.paymentIntents.search({
    query: `customer:'${customer}'`,
  });
  // console.log("searchPayment", searchPayment);
  // expand payment intent

  await Stripe.customers.retrieve(customer, { expand: ["pa"] });
}
//searchCustomer();

async function findPayment() {
  //Stripe.customers.retrievePaymentMethod("cus_OcIvXRDpttFPx0");

  const cus = await Stripe.customers.retrieve("cus_OcIvXRDpttFPx0", {
    expand: ["customer"],
  });
  console.log("customer", cus);
}
//findPayment();

async function listPaymentMethod() {
  const paymentMethods = await Stripe.customers.listPaymentMethods(
    "cus_Ocf6WcNYDwZGCO",
    { type: "card", expand: ["data.customer"] }
  );
  console.log("customer", paymentMethods);
}
//listPaymentMethod();

async function retrievePi() {
  const pi = await Stripe.paymentIntents.retrieve(
    "pi_3NpQDkDo67vHA3BF2ro3Z3km",
    { expand: ["customer"] }
  );
  console.log("pi", pi);
}
//retrievePi();


async function createSubSchedule() {
  // const exists = await Stripe.products.retrieve('test_product')
  // console.log('exists',exists)
  // const product = await Stripe.products.create({
  //   name:'test product',
  //   id:'test_product',
  //   default_price_data:{
  //     currency:'usd',
  //     unit_amount:1000,
  //     recurring:{
  //       interval:'month',
  //       interval_count:1,
  //     }
  //   }
  // })

  //  const sub2=  await stripe.subscriptionSchedules.update(subId,{
  const subscriptionSchedule = await Stripe.subscriptionSchedules.update('sub_sched_1NqYKhDo67vHA3BFKfVZRREa',{
   // customer: 'cus_OdV8wCVl9MQGBP',
    
    //start_date:moment(Number(1695972561375)).unix(),//new Date().getSeconds()+2000, //moment().toNow() metadata.timestamp,
    // end_behavior:'release',
    // expand: ['phases'],
    phases: [
      {

        currency:'usd',
       // iterations: 1, // or end_date
        end_date:'now',
        //start_date:'now',
        items: [
          { 
            price_data:{
              unit_amount:1,
              currency:'usd',
              product: 'test_product',
              recurring:{
                interval:'month',
                interval_count:1,
              }
            },
            metadata:{
              type:'first_lesson',
            },
            quantity: 1,
          },
        ]
      },
    ],
  });


  console.log('subscriptionSchedule'  ,subscriptionSchedule)
}

//createSubSchedule()

async function createPrice(){

  const price = await Stripe.prices.create({
    unit_amount: 2000,
    currency: 'usd',
   // recurring: {interval: 'month'},
    product: 'prod_ObzYq2T2wUiRt9',
  });
  console.log('price',price)

  Stripe.prices.update('price_1NqYdvDo67vHA3BFJVei99ac',{
    
  })
};


async function cancelSubSchedules(){
  // const subscriptionSchedule = await Stripe.subscriptionSchedules.list({customer:'cus_OdV8wCVl9MQGBP'})
  // console.log('subscriptionSchedule/count'  ,subscriptionSchedule.data.length)
  // for(const n of subscriptionSchedule.data){
  //   if(n.status === 'canceled') continue
  //   let c = await Stripe.subscriptionSchedules.cancel(n.id)
  //   console.log('schedule canceled',c.id, c.status)
  //   await delay(100)
  // }

  // cancel one schedule
  const c = await Stripe.subscriptionSchedules.cancel('sub_sched_1NqYKhDo67vHA3BFKfVZRREa')
}

cancelSubSchedules()