// this is the stripe product api


/** 
 * @typedef {import('stripe').Stripe} Stripe
 * @typedef {import('../../types').Customer.LessonSession} LessonSession
 */

const {paymentIntentCreateParams,scheduleRecurrence}= require('../../config')




/**
 * create a product
 * @param {Stripe} stripe 
 */
exports.createProduct = async (stripe, name = 'Guitar Lesson', id = 'guitar_lesson') => {
  
  try {
    await stripe.products.retrieve(id)
   // console.log('[createProduct][exists]', id)
    return
  } catch (err) {
   // console.log('[createProduct][error][not exists]', id)
  }

  try {
    const product = await stripe.products.create({
      name,
      id,
      default_price_data: {
        currency: paymentIntentCreateParams.currency,
        unit_amount: paymentIntentCreateParams.amount,
        recurring: {
         ...scheduleRecurrence
        },
      },
    })
    console.log('[createProduct][create]', product.id)
  } catch (err) {
    console.error('[createProduct][error]', id, err)
  }

}