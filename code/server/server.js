/* eslint-disable no-console */
require('dotenv').config({ path: './.env' })

/** @typedef {import('stripe').Stripe.errors} StripeErrors */
/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentMethod} PaymentMethod */
/** @typedef {import('stripe').Stripe.PaymentIntent} PaymentIntent */
/** @typedef {import('stripe').Stripe.Customer} Customer*/
/** @typedef {import('stripe').Stripe.Charge} Charge*/
/** @typedef {import('stripe').Stripe.Subscription} Subscription*/
/** @typedef {import('stripe').Stripe.Invoice} Invoice*/

// do not remove
//require("./_preset");

const express = require('express')
const app = express()
const { resolve, join } = require('path')
const moment = require('moment')

// Replace if using a different env file or config

const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const { EMAIL_REGEX } = require('./constants')
const ejs = require('ejs')
const fs = require('fs')
const { apiVersion, clientDir } = require('./config')

const { createSubSchedule,cancelCustomerSubscriptions } = require('./libs/schedules')


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
        fs.readFileSync(
          join(__dirname, process.env.STATIC_DIR, clientDir, 'manifest.json'),
          'utf8',
        ),
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
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      )
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

  if (eventType === 'payment_intent.amount_capturable_updated') {
    // try {
    //   /** @type {PaymentIntent} */
    //   const pi = data.object
  

    // } catch (err) {
    //   // console.error(err)
    // }
  }

  // if(eventType === 'customer.subscription.created'){
  //   console.log('[webhook][object][id]', data?.object)
  // }

  if (eventType === 'payment_method.attached') {
    // update customer name and email via webhook instead of using: /account-update/:customer_id
    /** @type {PaymentMethod} */
    const pm = data.object

    try {
      // when ever new payment method is attached check and delete old payment methods
      const customersPaymentMethods = (await stripe.customers.listPaymentMethods(pm.customer)).data

      for (const n of customersPaymentMethods) {
        if (n.id !== pm.id) {
          await stripe.paymentMethods.detach(n.id)
          console.log(
            '[customersPaymentMethods][detached]',
            pm.customer,
            ' old payment_method_id: ',
            n.id,
          )
        }
      }
    } catch (err) {
      console.error(pm.customer, err)
    }

    // add new subscription schedule id to customer metadata

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
      console.error(pm.customer, err)
    }

    // create new subscription schedule for customer
 
  }

  if (eventType === 'charge.refunded') {
    /** @type {Charge} */
    const rf = data.object
    // cancel subscription schedule

    // it is unclear which subscription schedule to cancel here
    await cancelCustomerSubscriptions(stripe, rf.customer)

  }

  if (eventType === 'customer.deleted') {
    /** @type {Customer} */
    const cus = data.object
    // cancel subscription schedule
    await cancelCustomerSubscriptions(stripe, cus.id)
  }


  if (eventType === 'customer.subscription.created') {
    
  }
   
  if (eventType === 'customer.subscription.updated') {

   
  }

  // Use the Payment Intents API to initiate a new payment instead of using this method. Confirmation of the PaymentIntent creates the Charge object used to request payment, so this method is limited to legacy integrations.

  // try to manually invoice customer if its due
  if (eventType === 'invoice.created') {

    /** @type {Invoice} */
    const inv = data.object

    // invoice Placing a hold on a payment
    // https://stripe.com/docs/billing/invoices/subscription#placing-a-hold-on-a-payment
    console.log('[webhook][object][date] ', moment.unix(inv.created).toString())

    const { type } = inv?.subscription_details?.metadata;
   
    if (type === 'invoice_and_charge') {

      console.log('invoice_and_charge/subscription_details',inv?.subscription_details)
    
      // const requires_capture = paymentIntents.data.filter(
      //   (n) => n.status === 'requires_capture',
      // );

      // if (requires_capture.length) {
      //   // capture payment intent
      //   const paymentIntent = await stripe.paymentIntents.capture(requires_capture[0].id, {
      //     amount_to_capture: inv.amount_due,
      //   })
      //   console.log('[invoice_and_charge][paymentIntent]', paymentIntent.id)
      // }
      return
    }

      // retrieve customer
      const customer = (async () => {
        try {
          const cus = await stripe.customers.retrieve(inv.customer)
          if (cus.deleted) throw Error(`customer deleted: ${inv.customer}`)
          return cus
        } catch (err) {}
      })()
      
      if(!customer) return

      const paymentMethod = await(async()=>{
        try{
          return (await stripe.paymentMethods.list({
            customer: inv.customer,
            type: 'card',
            expand: ['data.customer'],
          })).data[0]
        }catch(er){
          console.error('[paymentMethods][error]', er)
        }
      })()


      // on 5th day
      if (type === 'auth_pending_payment') {

        // before the due data,  create new payment intent and delete the old one
        // then only authorize the payment with the whole billable amount
        // if the student decides to cancel 2 days before the due date, we use the new payment intent that was created on 5 days before subscription

        // try and remove old intents belonging to the customer

        // try {
        //   const oldIntents = paymentIntents.data.filter(
        //     (n) => n.status !== 'succeeded' && n.status !== 'canceled',
        //   )

        //   for (const n of oldIntents) {
        //     await stripe.paymentIntents.cancel(n.id)
        //    // console.log('[oldIntents][canceled]', n.id)
        //   }

        // } catch (err) {}
 
        try {
 
          // create new intent with capture_method:manual
          const piCreate = await stripe.paymentIntents.create({
            amount: Number(inv.subscription_details.metadata.amount_capturable),
            currency: inv.currency,
            confirm:false,
            receipt_email: paymentMethod.customer.email,
            customer: inv.customer,
            description: inv.description,
            payment_method: paymentMethod.id,
            capture_method: 'manual',
            setup_future_usage: 'off_session',
            metadata: {
              ...paymentMethod.customer.metadata,
              type,
              invoice_id: inv.id,
            },
          })
  
          const paymentIntentConfirm = await stripe.paymentIntents.confirm(piCreate.id, {
            payment_method: 'pm_card_visa',
            capture_method: 'manual',
            setup_future_usage: 'off_session',
          })

          console.log('[auth_pending_payment][paymentIntentConfirm]', paymentIntentConfirm.id)
        } catch (err) {
          console.error('[auth_pending_payment][error]', err)
        }
      }

 
  }

  if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!')
    
    // /** @type {PaymentIntent} */
    // const pi = data.object

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
