const express = require('express')
const apiRouter = express.Router()
const { resolve } = require('path');
const { customerMetadata, customerExists, findCustomerSetupIntent } = require('../utils');
const { paymentIntentCreateParams } = require('../config')

/**
 * API router
 * @param {import('stripe').Stripe} stripe 
 * @returns 
 */
exports.apiRouter = (stripe) => {


    // import and mount api routes
    apiRouter.get("/config", (req, res) => {
        res.send({
            key: process.env.STRIPE_PUBLISHABLE_KEY
        })
    });

    //ATTENTION this is confusing, why do we even have this here, react does not generate a page for this, all rendered from index.html
    // Milestone 1: Signing up
    // Shows the lesson sign up page.
    apiRouter.get('/lessons', (req, res) => {
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

    apiRouter.post('/lessons', async (req, res) => {
        try {
            const { learnerEmail, learnerName, metadata, type } = req.body || {}

            console.log('[lessons][body]', req.body)
            if (!learnerEmail || !learnerName) return res.status(400).send({ error: { message: 'missing learnerEmail or learnerName' } })

            const meta = customerMetadata(metadata || {})
            const cus = await stripe.customers.search({ query: `email:"${learnerEmail}"`, expand: [] })
            
            if (cus.data?.length){
                const d = cus.data[0]
                return res.send({
                    
                    exist: true,
                    name: d.name,
                    email: d.email,
                    customerId: d.id,
                })
            }
            const r = await stripe.customers.create({ email: learnerEmail, name: learnerName, metadata: meta })


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
                    let index
                    if (r.metadata.type === 'first_lesson') index = 0
                    if (r.metadata.type === 'second_lesson') index = 1
                    if (r.metadata.type === 'third_lesson') index = 2

                    return index
                })()
            }

               const paymentIntent = await stripe.paymentIntents.create({
                   ...paymentIntentCreateParams,
                   customer: r.id,  // one customer only
                    confirm: false,
                    receipt_email: learnerEmail,
                    metadata: r.metadata,
                   // automatic_payment_methods: { enabled: true },
                })     
      
            console.log('[GET][lessons][customer]', r)
            console.log('[GET][lessons][paymentIntent]', paymentIntent)


            // the values are confusing, customer object use as customerId
            const secrets = {
                paymentIntent: paymentIntent?.client_secret,
                // setupIntent: setupIntent?.client_secret
            }
            return res.send({
                exist: false,
                secrets,
                customerId: r.id,
                ...(r.metadata ? { metadata: r.metadata } : {}),
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
     * @description get payment method details
     * - This api was added as the milestone one is inconclusive, you cannot retrieve last4 from `setupIntents to stripe.confirmCardSetup on client side, unless creating paymentIntent 
     * - the mile stone asks the save card details first for later use.
     * 
     */
    apiRouter.get("/card/:payment_method", async (req, res) => {
        const { payment_method } = req.params

        if (!payment_method) return res.status(400).send({ error: { message: 'missing payment_method' } })

        try {
            const pm = await stripe.paymentMethods.retrieve(payment_method, { expand: ['customer'] })
            res.status(200).send({
                ...pm,
            })
        } catch (err) {
            console.error('[card/:payment_method]', err)
            res.status(500).send({
                error: true,
                message: err.message
            })
        }
    })

    /**
     * @api lookup https://stripe.com/docs/api/payment_methods/customer_list?lang=node
     */
    apiRouter.get("/payment-method/:customer_id", async (req, res) => {

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
                    customer: await stripe.customers.retrieve(customer_id)
                }
            }

            // find setupIntent
            let clientSecret
            let setupIntent
            const { client_secret } = await findCustomerSetupIntent(stripe, customer_id)

            // if no setupIntent create one
            if (!client_secret) {
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
    apiRouter.post("/schedule-lesson", async (req, res) => {
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
    apiRouter.post("/complete-lesson-payment", async (req, res) => {
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
    apiRouter.post("/refund-lesson", async (req, res) => {
        // TODO: Integrate Stripe
    });

    // Milestone 3: Managing account info
    // Displays the account update page for a given customer
    apiRouter.get("/account-update/:customer_id", async (req, res) => {
        try {
            const path = resolve(`${process.env.STATIC_DIR}/account-update.html`);
            if (!fs.existsSync(path)) throw Error();
            res.sendFile(path);
        } catch (error) {
            const path = resolve('./public/static-file-error.html');
            res.sendFile(path);
        }
    });



    apiRouter.post("/update-payment-details/:customer_id", async (req, res) => {
        // TODO: Update the customer's payment details
    });

    // Handle account updates
    apiRouter.post("/account-update", async (req, res) => {
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
    apiRouter.post("/delete-account/:customer_id", async (req, res) => {
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
    apiRouter.get("/calculate-lesson-total", async (req, res) => {
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


    apiRouter.get("/find-customers-with-failed-payments", async (req, res) => {
        // TODO: Integrate Stripe
    });



    return apiRouter
}