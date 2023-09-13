/**
 * @typedef {import('../types').CustomerType.Update} CustomerUpdate
 * @typedef {import('../types').CustomerType.PaymentMethod} CustomerPaymentMethod
 */

import { errorHandler } from '../utils'

/**
 * @GET
 * @api {{baseUrl}}/v1/payment_methods/:payment_method
 * Get customer payment information and metadata
 * @param {*} id
 * @returns  {Promise<CustomerPaymentMethod>}
 */
export const getCustomer = async (id) => {
  const response = await fetch(`/api/payment-method/${id}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    console.error('[getCustomer]: Error happened while fetching data')
    // console.error(response)
    return await errorHandler(response)
  }
  const data = await response.json()
  return data
}

/**
 * @POST
 * @api {{baseUrl}}/v1/account-update/:customer_id
 * Update customer email | name, and return new setupIntent secret including {customer, payment} object's
 * @param {string} customerId
 * @param {{name?:string,email?:string}} body
 * @returns {Promise<CustomerUpdate>}
 */
export const customerAccountUpdate = async (customerId, body) => {
  const response = await fetch(`/api/account-update/${customerId}`, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: !!body && JSON.stringify({ name: body?.name, email: body?.email }),
  })
  if (!response.ok) {
    console.error('[customerAccountUpdate]: Error happened while fetching data')
    // console.error(response)
    return await errorHandler(response)
  }
  const data = await response.json()
  return data
}
