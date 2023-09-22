/** @typedef {import('stripe').Stripe.SetupIntent} StripeSetupIntent */
/** @typedef {import('../types').CustomerType.CardSetupIntentConfirmation} CardSetupIntentConfirmation*/

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import React, { useEffect, useState, useRef } from 'react'

import CardCheckoutForm from './CardCheckoutForm'
import { serverConfig } from '../Services/config'
import { customerAccountUpdate } from 'src/Services/account'
import { MESSAGES } from '../constants'
import { setCustomerSession, customerFromSession, delCustomerSession, delay } from '../utils/index'
const LoadStripe = (async () => {
  let stripePromise
  try {
    const STRIPE_PUBLISHABLE_KEY = (await serverConfig()).key
    stripePromise = await loadStripe(STRIPE_PUBLISHABLE_KEY, {
      apiVersion: '2022-11-15',
    })
  } catch (err) {}
  return stripePromise
})()

const UpdateCustomer = ({ customer, customerName, customerEmail, customerUpdateConfirmation }) => {
  // identifies the status for api request to {{baseUrl}}/v1/account-update/:customer_id
  const [status, setStatus] = useState('initial') // 'initial'|'loading' | 'success' | 'error'
  const [error, setError] = useState(null)

  const [email, setEmail] = useState(customerEmail || '')
  const [name, setName] = useState(customerName || '')
  const [setupIntentSecret, setSetupIntentSecret] = useState(null)
  const stripePromise = useRef(LoadStripe)
  const appearance = {
    labels: 'floating',
  }

  const DisplayCustomerDetails = () => {
    return (
      <div className="lesson-input-box first">
        <span>
          {name || customer?.name} ({email || customer?.email})
        </span>
      </div>
    )
  }

  const initiateStripeHandler = () => {
    if (status === 'loading') return
    setError(null)
    setStatus('loading')
    customerAccountUpdate(customer.id, { email, name })
      .then((result) => {
        setSetupIntentSecret(result.secret.setupIntent)
        setCustomerSession({ name: result.customer.name, email: result.customer.email, customerId: result.customer.id,timestamp:result.customer.metadata.timestamp  })
        setStatus('success')
      })
      .catch((e) => {
        setStatus('error')
        if (e.toString().includes('INVALID_EMAIL')) setError(MESSAGES.INVALID_EMAIL)
        else setError(MESSAGES.EMAIL_EXISTS)
      })
  }

  return (
    <div className="lesson-form">
      <div className="lesson-desc">
        <h3>Update your Payment details</h3>
        <div className="lesson-info">Fill out the form below if you'd like to us to use a new card.</div>

        <div className="lesson-grid">
          <div className="lesson-inputs">
            {status !== 'success' ? (
              <>
                <div className="lesson-input-box">
                  <input
                    type="text"
                    id="name"
                    disabled={status === 'loading'}
                    placeholder="Name"
                    autoComplete="cardholder"
                    className="sr-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="lesson-input-box">
                  <input
                    disabled={status === 'loading'}
                    type="text"
                    id="email"
                    placeholder="Email"
                    autoComplete="cardholder"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <DisplayCustomerDetails />
              </>
            )}

            {stripePromise.current && status === 'success' && (
              <Elements
                stripe={stripePromise.current}
                options={{
                  appearance,
                  clientSecret: setupIntentSecret,
                  loader: 'auto',
                }}
              >
                <div className="lesson-payment-element">
                  <CardCheckoutForm
                    type={'update'}
                    customer={{ name: name || customer?.name, email: email || customer?.email }}
                    onSuccessfulConfirmation={(type, status, resp) => {
                      if (type !== 'update') return

                      /** @type {CardSetupIntentConfirmation} */
                      const r = resp

                      if (status === 'success') {
                        if (typeof customerUpdateConfirmation === 'function') {
                          customerUpdateConfirmation(status, r)
                          delay(100).then(() => {
                            setStatus('initial')
                          })
                        }
                      } else {
                        console.log('error', status, r)
                      }
                    }}
                  />
                </div>
              </Elements>
            )}
          </div>
          {status === 'error' ? (
            <div id="card-errors">
              <div className="sr-field-error" id="customer-exists-error" role="alert">
                {error}
              </div>
            </div>
          ) : null}
        </div>

        {status !== 'success' && (
          <button id="checkout-btn" disabled={status === 'loading'} onClick={initiateStripeHandler}>
            {status === 'loading' ? (
              <div className="spinner" id="spinner"></div>
            ) : (
              <span id="button-text">Update Payment Method</span>
            )}
          </button>
        )}
        <div className="lesson-legal-info">
          Your card will not be charged. By registering, you hold a session slot which we will confirm within 24 hrs.
        </div>
      </div>
    </div>
  )
}
export default UpdateCustomer
