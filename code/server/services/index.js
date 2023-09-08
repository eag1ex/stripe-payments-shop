
const stripeBaseUrl = `https://api.stripe.com/v1`
const { apiVersion } = require('../config')
const { join } = require('path')
const secret_key = process.env.STRIPE_SECRET_KEY
// 
exports.getCustomerPaymentMethodType = async (customerId) => {

    // const headers = {
    //     "method": "get",
    //     "Content-Type": "application/x-www-form-urlencoded",
    //     "Authorization": `Bearer ${secret_key}`,
    //     //"Stripe-Version": apiVersion
    // }
    // const path = join(stripeBaseUrl, `/customers/${customerId}/payment_methods?type=card`)
    // console.log('[getCustomerPaymentMethodType][path]', path)
    // const response = await fetch(path, headers)
    // if (!response.ok) {
    //     console.error(response);
    //     throw new Error(response.statusText);
    // }

    // const data = await response.json();
    // return data;
}

