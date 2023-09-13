import { BASE_URL } from '../constants'

export const urlPath = (Path) => {
  if (BASE_URL) {
    return new URL(Path, BASE_URL).toString()
  } else {
    return new URL(Path, window.location.href).hostname
  }
}

export const customerObject = (customer) => {
  return {
    id: customer.customerId,
    email: customer.customerEmail,
    name: customer.customerName,
  }
}

export const customerCardObject = (card) => {
  return {}
}

export const delay = (time = 0) => {
  const isNum = typeof time === 'number' && time >= 0 // must provide number
  if (!isNum) return Promise.resolve(true) // or resolve
  // @ts-ignore
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      clearTimeout(t)
      resolve(true)
    }, time)
  })
}

export const errorHandler = async (errResponse) => {
  try {
    const r = (await errResponse.json()) || {}
    if (typeof r.error === 'object') {
      if (r.error.message) {
        throw new Error(r.error.message)
      } else {
        throw new Error(JSON.stringify(r.error))
      }
    } else {
      throw new Error(JSON.stringify(r))
    }
  } catch (err) {
    throw new Error(err)
  }
}

// The payment has been processed!
export const checkoutResp = (d) => {
  try {
    return {
      card: d?.payment_method?.card,
      billing_details: d?.payment_method?.billing_details,
      customerId: d?.payment_method?.customer,
    }
  } catch (err) {}
  return {}
}

/**
 * Get customer from session
 */
export const customerFromSession = () => {
  const customer = {
    email: sessionStorage.getItem('customerEmail'),
    name: sessionStorage.getItem('customerName'),
    customerId: sessionStorage.getItem('customerId'),
  }
  return customer
}

/**
 * Set customer session
 */
export const setCustomerSession = ({ name, email, customerId }) => {
  if (name) sessionStorage.setItem('customerEmail', email)
  if (email) sessionStorage.setItem('customerName', name)
  if (customerId) sessionStorage.setItem('customerId', customerId)
}

export const delCustomerSession = () => {
  sessionStorage.removeItem('customerEmail')
  sessionStorage.removeItem('customerName')
  sessionStorage.removeItem('customerId')
}
