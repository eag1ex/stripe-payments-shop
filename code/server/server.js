// @ts-nocheck

/* eslint-disable no-console */
require('dotenv').config({ path: './.env' })

/** @typedef {import('stripe').Stripe.errors} StripeErrors */
/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentMethod} PaymentMethod */

// do not remove
//require("./_preset");

const express = require('express')
const app = express()
const { resolve, join } = require('path')
// Replace if using a different env file or config

const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const { EMAIL_REGEX } = require('./constants')
const ejs = require('ejs')
const fs = require('fs')
const { apiVersion, clientDir } = require('./config')

/** @type {Stripe} */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion })

// const { getCustomerPaymentMethodType }  = require('./services')

const { apiRouter } = require('./api')
const e = require('express')
const allitems = {}
const apiBase = `https://api.stripe.com/v1`

app.set('trust proxy', 1) // trust first proxy
app.use(morgan('dev'))
app.engine('html', ejs.__express)
app.set('view engine', 'html')
app.use(bodyParser.urlencoded({ extended: false }))

app.use((req, res, next) => {
  try {
    // fixed manifest issue
    if (/manifest.json/i.test(req.path)) {
      res.header('Content-Type', 'application/json')
      const manifest = JSON.parse(
        fs.readFileSync(join(__dirname, process.env.STATIC_DIR, clientDir, 'manifest.json'), 'utf8'),
      )
      return res.status(200).json(manifest)
    }
  } catch (err) {
    return res.status(200).json({})
  }
  return next()
})

app.use(express.static(join(process.env.STATIC_DIR, clientDir)))

app.use(
  express.json({
    // Should use middleware or a function to compute it only when
    // hitting the Stripe webhook endpoint.
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString()
      }
    },
  }),
)

app.use(cors({ origin: true }))

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let data, eventType

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event
    let signature = req.headers['stripe-signature']
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`)
      return res.sendStatus(400)
    }
    data = event.data
    eventType = event.type

    //console.log("[webhook][data]", JSON.stringify(data, null, 1));
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data
    eventType = req.body.type
  }

  console.log('[webhook][eventType]', eventType)

  if (data?.object?.object) console.log('[webhook][object]', data?.object?.object)
  if (data?.object?.id) {
    console.log('[webhook][object][id]', data?.object?.id)
  }

  if (eventType === 'payment_method.attached') {
    if (data?.object?.object === 'payment_method') {
      // update customer name and email via webhook instead of using: /account-update/:customer_id
      /** @type {PaymentMethod} */
      const pm = data.object
      try {
        // make sure we only update if the email is valid
        const email = EMAIL_REGEX.test(pm.billing_details?.email) && pm.billing_details?.email
        const name = pm.billing_details?.name
        if (!!email || !!name) {
          await stripe.customers.update(pm.customer, {
            ...(name && { name }),
            ...(email && { email }),
          })
          console.log('[webhook][customers][updated]', pm.customer)
        }
      } catch (err) {
        console.error('[webhook][error]', pm.customer, err)
      }
    }
  }

  if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!')
  } else if (eventType === 'payment_intent.payment_failed') {
    console.log('❌ Payment failed.')
  }
  res.sendStatus(200)
})

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
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  res.header('Expires', '-1')
  res.header('Pragma', 'no-cache')
  res.sendFile(join(__dirname, process.env.STATIC_DIR, clientDir, 'index.html'))
})

function errorHandler(err, req, res, next) {
  res.status(500).send({ error: { message: err.message } })
}

app.use(errorHandler)

app.listen(4242, () => console.log(`Node server listening on port http://localhost:${4242}`))
