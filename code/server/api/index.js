// @ts-nocheck

const express = require('express')
const apiRouter = express.Router()
const { resolve } = require('path')
const fs = require('fs')

const { completeLessonPayment, scheduleLesson, refundLesson, lessonRefunded } = require('./ctrs/payments')
const {  postLessons } = require('./ctrs/lessons')
const { getCustomerPaymentMethod, accountUpdate,deleteCustomerAccount, findCustomersWithFailedPayments,updateCustomerMetadata } = require('./ctrs/customer-account')
const { createProduct } = require('../libs/products')
const {calculateLessonTotal} = require('./ctrs/reports')


/**
 * API router
 * @param {import('stripe').Stripe} stripe
 * @returns
 */
exports.apiRouter = (stripe) => {
  // stripe pre/requisites
  createProduct(stripe, 'Guitar Lesson', 'guitar_lesson')
  createProduct(stripe, 'Test product', 'test_product')

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
  apiRouter.get('/refunds/:refundId', lessonRefunded(stripe))
  //----------------------------------

  //-- lessons api
  // apiRouter.get('/lessons', getLessons(stripe))
  apiRouter.post('/lessons', postLessons(stripe))
  //----------------------------------

  //-- customer account api
  apiRouter.get('/payment-method/:customer_id', getCustomerPaymentMethod(stripe))
  apiRouter.post('/account-update/:customer_id', accountUpdate(stripe))
  apiRouter.post('/delete-account/:customer_id', deleteCustomerAccount(stripe))
 
  // ----------------------------------

  //-- reports api
  apiRouter.get('/calculate-lesson-total', calculateLessonTotal(stripe))
  apiRouter.get('/find-customers-with-failed-payments', findCustomersWithFailedPayments(stripe))
  //----------------------------------




  return apiRouter
}
