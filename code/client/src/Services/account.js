/**
 * @typedef {import('../types').CustomerType.Update} CustomerUpdate
 * @typedef {import('../types').CustomerType.PaymentMethod} CustomerPaymentMethod
 * @typedef {import('../types').CustomerType.LessonSession} LessonSession
 */

import { errorHandler ,metaData} from '../utils'


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
 * @param {{name?:string,email?:string, metadata?:LessonSession}} body
 * @returns {Promise<CustomerUpdate>}
 */
export const customerAccountUpdate = async (customerId, body) => {
  

  // updating metadata is optional
  console.log('customerAccountUpdate 1',body)
  if (body?.metadata) {
    body.metadata = metaData(body.metadata)
  }

  console.log('customerAccountUpdate 2',body)
  const response = await fetch(`/api/account-update/${customerId}`, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: !!body && JSON.stringify({ name: body?.name, email: body?.email, ...(body?.metadata ?{metadata:body?.metadata}:{} )  }),
  })


  if (!response.ok) {
    console.error('[customerAccountUpdate]: Error happened while fetching data')
    // console.error(response)
    return await errorHandler(response)
  }
  const data = await response.json()
  return data
}


export const createCustomer = async ({ learnerEmail, learnerName, metadata }) => {

  // customer metadata is LessonSession
  const response = await fetch('/api/lessons', {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ learnerEmail, learnerName, metadata: metaData(metadata) }),
  })
  if (!response.ok) {
    console.error('[createCustomer]: Error happened while fetching data')
    return await errorHandler(response)
  }
  const data = await response.json()

  return data
}

