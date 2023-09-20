
// this is the stripe price api


/** 
 * @typedef {import('stripe').Stripe} Stripe
 * @typedef {import('../../types').Customer.LessonSession} LessonSession
 */

const {baseCurrency} = require('../../config')

/**
 * 
 * @param {Stripe} stripe 
 * @param {LessonSession} metadata
 */
exports.createPrice = async (stripe, metadata) => {
    const price = await stripe.prices.create({
        unit_amount: 2000,
        currency: baseCurrency,
       // recurring: {interval: 'month'},
        product: 'prod_ObzYq2T2wUiRt9',
      });
}