/* eslint-disable no-console */
require('dotenv').config({ path: './.env' });

// do not remove
require('./_preset');


const express = require('express');
const app = express();
const { resolve, join } = require('path');
// Replace if using a different env file or config

const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const fs = require('fs');
const { apiVersion, clientDir } = require('./config');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, { apiVersion });
// const { getCustomerPaymentMethodType }  = require('./services')

const {apiRouter} = require('./api')
const allitems = {};
const apiBase = `https://api.stripe.com/v1`
const { customerMetadata, customerExists, findCustomerSetupIntent } = require('./utils');


app.set('trust proxy', 1) // trust first proxy
app.use(morgan('dev'))
app.engine('html', ejs.__express) 
app.set('view engine', 'html')
app.use(bodyParser.urlencoded({ extended: false }))


app.use((req, res, next) => {
  try{
    // fixed manifest issue
    if (/manifest.json/i.test(req.path)) {
      res.header("Content-Type", 'application/json');
      const manifest = JSON.parse(fs.readFileSync(join(__dirname, process.env.STATIC_DIR, clientDir,'manifest.json'), 'utf8'));
      return res.status(200).json(manifest);

    }
  }catch(err){
    return res.status(200).json({});
  }
  return next();
});

app.use(express.static(join(process.env.STATIC_DIR, clientDir)));


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





// stripe.customers.retrieve('cus_Oa4fBHkgqlcREw', {
//   expand: ['invoice_settings.default_payment_method']
// })

// stripe.paymentIntents.list({ customer: 'cus_Oa4fBHkgqlcREw',expand:['data.customer'] }).then(n => {
//   console.log('cus2', n)
// })

// stripe.paymentMethods.retrieve('pm_1NmvLTDo67vHA3BFqXlDbyFt', { expand:['customer'] }).then((n)=>{
//   console.log('cus2', n)
// })


// paymentIntent = stripe.paymentIntents.create({
//   setup_future_usage: 'off_session',

//   //    payment_method_options: {
//   //        card: {}
//   //    },
//   // one customer only
//   //customer: r.id,
//   //payment_method_types: ['card'],
//   confirm: false,
//   metadata: {},
//   amount: 100,
//   currency: 'thb',
//   automatic_payment_methods: { enabled: true },
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


// load the api app
app.use('/api', apiRouter(stripe))

// catch all other routes
// app.all('*', function (req, res) {
//   res.status(400).json({ message:'route not found', error: true })
// })

//Serving React
app.get('*', (req, res) => {

  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.sendFile(join(__dirname, process.env.STATIC_DIR, clientDir, 'index.html'));
});

function errorHandler(err, req, res, next) {
  res.status(500).send({ error: { message: err.message } });
}

app.use(errorHandler);

app.listen(4242, () => console.log(`Node server listening on port http://localhost:${4242}`));
