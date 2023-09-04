/* eslint-disable no-console */
const express = require('express');
const app = express();
const { resolve } = require('path');
const { customerMetadata, customerExists, findCustomerSetupIntent } = require('./utils');

// Replace if using a different env file or config
require('dotenv').config({ path: './.env' });
const { apiVersion } = require('./config');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, { apiVersion });
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
// const { getCustomerPaymentMethodType }  = require('./services')

const allitems = {};
const fs = require('fs');

const apiBase = `https://api.stripe.com/v1`




app.use(express.static(process.env.STATIC_DIR));


// setupIntents =  stripe.setupIntents.list({
//   customer: 'cus_OZinKz2wnwOFZT'
// }).then(n=>{
//   console.log('setupIntents',JSON.stringify(n, false,1))
// })

// stripe.customers.search({
//   query: 'name:\'mike\' AND email:\'mike@email.com\'', expand: ['data.payment_method']
// }).then(n=>{
//   console.log('cus1',JSON.stringify(n.data))
// })
   
// stripe.customers.retrieve('cus_OZcfJhKEMg5dQp', {
//   expand: [] }).then(n => {
//   console.log('cus2', n)
// })

// stripe.customers.listPaymentMethods(
//   'cus_OZdUr5QkFqWAkm',
//   { type: 'card', expand: ['data.customer'] }
// ).then(n=>{
//   console.log('listPaymentMethods',JSON.stringify(n.data[0], false,1))
// }) // returns a list of PaymentMethods data[0] >{}

// const paymentIntents = stripe.paymentIntents.list({
//   //customer:'cus_OZgHi3Nhyk3arf',
//   //limit: 3,
//   expand: ['data.customer']
// }).then(n=>{
//   console.log('paymentIntents!!',JSON.stringify(n, false,1))
// })

// const paymentIntentSearch = stripe.paymentIntents.search({
//   query: 'id:\'pm_1NmWvmDo67vHA3BFBUTXaRs0\''
// }).then(n=>{
//   console.log('paymentIntentSearch!!',JSON.stringify(n, false,1))
// })

// const paymentIntentRetrieve = stripe.paymentIntents.retrieve(
//   'pm_1NmWvmDo67vHA3BFBUTXaRs0',
// ).then(n=>{
//   console.log('paymentIntentRetrieve!!', JSON.stringify(n, false, 1))
// })

//
// "pm_1NmWvmDo67vHA3BFBUTXaRs0"


// stripe.customers.search({ query: `name:"mike12345" AND email:"mike12345@email.com" AND metadata['type']:"second_lesson"`, expand: [] }).then(n => {
//   console.log('customers.search12', JSON.stringify(n, false, 1))
// })

// stripe.customers.retrieve('cus_OZinKz2wnwOFZT', {
//   expand: ['invoice_settings.default_payment_method']
// }).then(n=>{
//   console.log('cus2', n)
// })

app.use(
  express.json(
    {
      // Should use middleware or a function to compute it only when
      // hitting the Stripe webhook endpoint.
      verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/webhook')) {
          req.rawBody = buf.toString();
        }
      },
    },
  ),
);
app.use(cors({ origin: true }));

// const asyncMiddleware = fn => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };



app.post('/webhook', async (req, res) => {
  let data, eventType;

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!');
  } else if (eventType === 'payment_intent.payment_failed') {
    console.log('❌ Payment failed.');
  }
  res.sendStatus(200);
});





// Routes
// app.get('/', (req, res) => {
//   try {
//     const path = resolve(`${process.env.STATIC_DIR}/index.html`);
//     if (!fs.existsSync(path)) throw Error();
//     res.sendFile(path);
//   } catch (error) {
//     const path = resolve('./public/static-file-error.html');
//     res.sendFile(path);
//   }
// });

// Fetch the Stripe publishable key
//
// Example call:
// curl -X GET http://localhost:4242/config \
//
// Returns: a JSON response of the pubblishable key
//   {
//        key: <STRIPE_PUBLISHABLE_KEY>
//   }

app.get("/config", (req, res) => {
  res.send({
    key:process.env.STRIPE_PUBLISHABLE_KEY
  })

});

//ATTENTION this is confusing, why do we even have this here, react does not generate a page for this, all rendered from index.html
// Milestone 1: Signing up
// Shows the lesson sign up page.
app.get('/lessons', (req, res) => {
  try {
    console.log('running sessons')
    const path = resolve(`${process.env.STATIC_DIR}/lessons.html`);
    if (!fs.existsSync(path)) throw Error();
    console.log('running sessons2')
    res.sendFile(path);
  } catch (error) {
    const path = resolve('./public/static-file-error.html');
    res.sendFile(path);
  }
});



app.post('/lessons', async (req, res) => {
  try {
    const { learnerEmail, learnerName, metadata, type } = req.body ||{}
    // {type} update existing customer or create new 
    console.log('[lessons][body]', req.body)
    if (!learnerEmail || !learnerName) return res.status(400).send({ error: { message: 'missing learnerEmail or learnerName'}})

    const meta = customerMetadata(metadata ||{})
    const exists = await customerExists(stripe, { learnerName, learnerEmail })
    const r = exists.data?.length ? { ...exists.data[0], exist: exists.hasPayment } : { ...(await stripe.customers.create({ email: learnerEmail, name: learnerName, metadata: meta })), exist:false}


    let setupIntent

    if(!r.exist){
      setupIntent = await stripe.setupIntents.create({
        customer: r.id,
        metadata: meta,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    }
    // mike12345 (mike12345@email.com)

    console.log('[GET][lessons][customer]', r)
    console.log('[GET][lessons][setupIntent]', setupIntent)


    // type
// :"first_lesson"

    if (r.metadata){
      r.metadata.index = (()=>{
        let index 
        if (r.metadata.type === 'first_lesson') index=0
        if (r.metadata.type === 'second_lesson') index = 1
        if (r.metadata.type === 'third_lesson') index = 2

        return index
      })()
    }

    // the values are confusing, customer object use as customerId
    return res.send({
      exist: r.exist,
      clientSecret: setupIntent?.client_secret,
      customerId: r.id,
      ...(r.metadata?{metadata:r.metadata}:{}),
      name: r.name,
      email: r.email,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
    

  } catch (error) {

    console.error('[lessons][error]', error)
    
    res.status(400).send({
      error: {
        message: error.message,
      }
    });

  }
});


/**
 * @api lookup https://stripe.com/docs/api/payment_methods/customer_list?lang=node
 */
app.get("/payment-method/:customer_id", async (req, res) => {

  const { customer_id } = req.params

  if (!customer_id) return res.status(400).send({ error: { message: 'missing customer_id' } })

  // if 
  console.log('[GET][payment-method][customer]', customer_id)

  


  try {
    let r
    // data.payment_method
    const paymentList = r = (await stripe.customers.listPaymentMethods(
      customer_id,
      { type: 'card', expand: ['data.customer'] }
    ))?.data[0] //{customer,card}

    // if no payment exists get customer instead
    if (!paymentList) {
      r = {
        customer: await stripe.customers.retrieve(customer_id, {
          expand: ['metadata']
        })
      }
    }

    // find setupIntent
    let clientSecret
    let setupIntent
    const { client_secret } = await findCustomerSetupIntent(stripe, customer_id)

    // if no setupIntent create one
    if (!client_secret){
      setupIntent = await stripe.setupIntents.create({
        customer: r.customer.id,
        metadata: r.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    }

    clientSecret = client_secret || setupIntent?.client_secret

    res.status(200).send({
      ...r,
      clientSecret,
    })
  } catch (err) {
    console.error('[error]', err)
    return res.status(400).send({ error: err })
  }

});





// TODO: Integrate Stripe

// Milestone 2: '/schedule-lesson'
// Authorize a payment for a lesson
//
// Parameters:
// customer_id: id of the customer
// amount: amount of the lesson in cents
// description: a description of this lesson
//
// Example call:
// curl -X POST http://localhost:4242/schedule-lesson \
//  -d customer_id=cus_GlY8vzEaWTFmps \
//  -d amount=4500 \
//  -d description='Lesson on Feb 25th'
//
// Returns: a JSON response of one of the following forms:
// For a successful payment, return the Payment Intent:
//   {
//        payment: <payment_intent>
//    }
//
// For errors:
//  {
//    error:
//       code: the code returned from the Stripe error if there was one
//       message: the message returned from the Stripe error. if no payment method was
//         found for that customer return an msg 'no payment methods found for <customer_id>'
//    payment_intent_id: if a payment intent was created but not successfully authorized
// }
app.post("/schedule-lesson", async (req, res) => {
  // TODO: Integrate Stripe
 

});


// Milestone 2: '/complete-lesson-payment'
// Capture a payment for a lesson.
//
// Parameters:
// amount: (optional) amount to capture if different than the original amount authorized
//
// Example call:
// curl -X POST http://localhost:4242/complete_lesson_payment \
//  -d payment_intent_id=pi_XXX \
//  -d amount=4500
//
// Returns: a JSON response of one of the following forms:
//
// For a successful payment, return the payment intent:
//   {
//        payment: <payment_intent>
//    }
//
// for errors:
//  {
//    error:
//       code: the code returned from the error
//       message: the message returned from the error from Stripe
// }
//
app.post("/complete-lesson-payment", async (req, res) => {
  // TODO: Integrate Stripe

});

// Milestone 2: '/refund-lesson'
// Refunds a lesson payment.  Refund the payment from the customer (or cancel the auth
// if a payment hasn't occurred).
// Sets the refund reason to 'requested_by_customer'
//
// Parameters:
// payment_intent_id: the payment intent to refund
// amount: (optional) amount to refund if different than the original payment
//
// Example call:
// curl -X POST http://localhost:4242/refund-lesson \
//   -d payment_intent_id=pi_XXX \
//   -d amount=2500
//
// Returns
// If the refund is successfully created returns a JSON response of the format:
//
// {
//   refund: refund.id
// }
//
// If there was an error:
//  {
//    error: {
//        code: e.error.code,
//        message: e.error.message
//      }
//  }
app.post("/refund-lesson", async (req, res) => {
  // TODO: Integrate Stripe
});

// Milestone 3: Managing account info
// Displays the account update page for a given customer
app.get("/account-update/:customer_id", async (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/account-update.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve('./public/static-file-error.html');
    res.sendFile(path);
  }
});



app.post("/update-payment-details/:customer_id", async (req, res) => {
  // TODO: Update the customer's payment details
});

// Handle account updates
app.post("/account-update", async (req, res) => {
  // TODO: Handle updates to any of the customer's account details
});

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
app.post("/delete-account/:customer_id", async (req, res) => {
  // TODO: Integrate Stripe
});


// Milestone 4: '/calculate-lesson-total'
// Returns the total amounts for payments for lessons, ignoring payments
// for videos and concert tickets, ranging over the last 36 hours.
//
// Example call: curl -X GET http://localhost:4242/calculate-lesson-total
//
// Returns a JSON response of the format:
// {
//      payment_total: Total before fees and refunds (including disputes), and excluding payments
//         that haven't yet been captured.
//      fee_total: Total amount in fees that the store has paid to Stripe
//      net_total: Total amount the store has collected from payments, minus their fees.
// }
//
app.get("/calculate-lesson-total", async (req, res) => {
  // TODO: Integrate Stripe
});


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
//       error: the error returned from the payment attempt
//     },
//     payment_method: {
//       last4: last four of the card stored on the customer
//       brand: brand of the card stored on the customer
//     }
//   },
//   {},
//   {},
// ]
app.get("/find-customers-with-failed-payments", async (req, res) => {
  // TODO: Integrate Stripe
});

function errorHandler(err, req, res, next) {
  res.status(500).send({ error: { message: err.message } });
}

app.use(errorHandler);

app.listen(4242, () => console.log(`Node server listening on port http://localhost:${4242}`));
