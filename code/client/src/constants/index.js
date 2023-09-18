// on production this will default to server url
export const BASE_URL = process.env.REACT_APP_LOCALHOST || undefined

export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

export const CARD_ELEMENT_OPTIONS = {
  theme: 'stripe',

  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
}

export const MESSAGES = {
  EMAIL_EXISTS: 'Customer email already exists!',
  INVALID_EMAIL: 'Invalid email!',
}
