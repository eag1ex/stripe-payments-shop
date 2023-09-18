const express = require('express')
const apiRouter = express.Router()
const { resolve } = require('path')
const fs = require('fs')

const { completeLessonPayment, scheduleLesson, refundLesson, lessonRefunds } = require('./ctrs/payments')

const { getLessons, postLessons } = require('./ctrs/lessons')

const { getCustomerPaymentMethod, accountUpdate,deleteCustomerAccount } = require('./ctrs/customer-account')
const { createProduct } = require('../libs/products')



/**
 * API router
 * @param {import('stripe').Stripe} stripe
 * @returns
 */
exports.apiRouter = (stripe) => {

  // stripe pre/requisites
   createProduct(stripe,'Guitar Lesson','guitar_lesson')
   createProduct(stripe,'Test product','test_product')



  // import and mount api routes
  apiRouter.get('/config', (req, res) => {
    res.send({
      key: process.env.STRIPE_PUBLISHABLE_KEY,
    })
  })

  //-- payments api

  apiRouter.post('/complete-lesson-payment', completeLessonPayment(stripe))
  apiRouter.post('/schedule-lesson', scheduleLesson(stripe))
  apiRouter.post('/refund-lesson', refundLesson(stripe))
  apiRouter.get('/refunds/:refundId', lessonRefunds(stripe))
  //----------------------------------

  //-- lessons api
  apiRouter.get('/lessons', getLessons(stripe))
  apiRouter.post('/lessons', postLessons(stripe))
  //----------------------------------

  //-- customer account api
  apiRouter.get('/payment-method/:customer_id', getCustomerPaymentMethod(stripe))
  apiRouter.post('/account-update/:customer_id', accountUpdate(stripe))
  apiRouter.post('/delete-account/:customer_id', deleteCustomerAccount(stripe))
  // ----------------------------------

  // Milestone 3: Managing account info
  // Displays the account update page for a given customer
  // apiRouter.get('/account-update/:customer_id', async (req, res) => {
  //   try {
  //     const path = resolve(`${process.env.STATIC_DIR}/account-update.html`)
  //     if (!fs.existsSync(path)) throw Error()
  //     res.sendFile(path)
  //   } catch (error) {
  //     const path = resolve('./public/static-file-error.html')
  //     res.sendFile(path)
  //   }
  // })

 

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
  apiRouter.get('/calculate-lesson-total', async (req, res) => {
    // TODO: Integrate Stripe
  })

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

  apiRouter.get('/find-customers-with-failed-payments', async (req, res) => {
    // TODO: Integrate Stripe
  })

  return apiRouter
}
