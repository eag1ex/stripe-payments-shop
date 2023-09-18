import { Elements, AddressElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import React, { useEffect, useRef, useState } from 'react'
import CardSetupForm from './CardSetupForm'
import { createCustomer } from '../Services/customer'
import { serverConfig } from '../Services/config'
import { setCustomerSession, customerFromSession, delCustomerSession } from '../utils/index'

// history.push({}, document.title, window.location.pathname)
// it would be best to use environment variables, but i dont see that in code.client root, i do understand you want to call it from GET /config, so in order not to rerender the object we declare it before render, as advised in your docs, @source: https://stripe.com/docs/payments/save-and-reuse?platform=web&ui=elements

const LoadStripe = (async () => {
  let stripePromise
  try {
    const STRIPE_PUBLISHABLE_KEY = (await serverConfig()).key

    stripePromise = await loadStripe(STRIPE_PUBLISHABLE_KEY, {
      apiVersion: '2022-11-15',
    })
  } catch (err) {
    console.error('[LoadStripe][error]', err)
  }
  return stripePromise
})()

const RegistrationForm = (props) => {
  const { selected, details, session, onUpdate } = props
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [learnerEmail, setLearnerEmail] = useState('')
  const [learnerName, setLearnerName] = useState('')
  const [sameEmail, setSameEmail] = useState(false)
  const [customer, setCustomer] = useState(null)
  const stripePromise = useRef(LoadStripe)
  const appearance = {
    labels: 'floating',
  }

  const handleChange = async (value, field) => {
    if (field === 'learnerEmail') setLearnerEmail(value)
    if (field === 'learnerName') setLearnerName(value)
  }

  const handleClickForPaymentElement = async () => {
    if (
      !!learnerEmail &&
      !!learnerName &&
      (customer?.email === learnerEmail ||
        // this works with test!
        customerFromSession().email === learnerEmail)
    ) {
      // customer from session!
      setSameEmail(true)
      setError(null)
      return false
    }

    if (processing) return

    setError(null)
    setProcessing(true)
    setCustomer(null)
  
    createCustomer({ learnerEmail, learnerName, metadata: session })
      .then((n) => {
        if (n.exist) {
          setProcessing(false)
          setCustomer({
            customerId: n.customerId,
            email: n.email,
            name: n.name,
            exist: n.exist,
          })
          return
        }

        setCustomerSession({
          name: n.name,
          email: n.email,
          customerId: n.customerId,
        })

        setProcessing(false)
        setCustomer({
          secrets: n.secrets,
          customerId: n.customerId,
          email: n.email,
          name: n.name,
          card: n.card,
          exist: n.exist,
          metadata: n.metadata,
        })

        if (typeof onUpdate === 'function' && n.exist) {
          onUpdate('registration', n.metadata)
        }
      })
      .catch((e) => {
        setCustomer(null)
        delCustomerSession()
        console.log('[RegistrationForm][error]', e)
        setError(e.message)
        setProcessing(false)
      })
  }

  let body = null

  if (selected === -1) {
    return <>{body}</>
  }
  if (customer?.secrets?.setupIntent && customer?.exist === false && selected !== -1) {
    body = (
      <>
        <Elements
          stripe={stripePromise.current}
          options={{
            appearance,
            clientSecret: customer?.secrets?.setupIntent,
            loader: 'auto',
          }}
        >
          <CardSetupForm customer={customer} selected={selected} type="create" session={session} details={details} />
        </Elements>
      </>
    )
  } else {
    body = (
      <div className={`lesson-desc`}>
        <h3>Registration details</h3>
        <div id="summary-table" className="lesson-info">
          {details}
        </div>
        <div className="lesson-legal-info">
          Your card will not be charged. By registering, you hold a session slot which we will confirm within 24 hrs.
        </div>

        <div className="lesson-grid">
          <div className="lesson-inputs">
            <div className="lesson-input-box first">
              <label>Name</label>
              <input
                required
                type="text"
                id="name"
                value={learnerName}
                placeholder="Name"
                autoComplete="cardholder"
                className="sr-input"
                onChange={(e) => handleChange(e.target.value, 'learnerName')}
              />
            </div>
            <div className="lesson-input-box middle">
              <label>Email</label>
              <input
                required
                type="text"
                id="email"
                value={learnerEmail}
                placeholder="Email"
                autoComplete="cardholder"
                onChange={(e) => handleChange(e.target.value, 'learnerEmail')}
              />
            </div>
            <button
              id="checkout-btn"
              disabled={processing || !learnerEmail || !learnerName}
              onClick={handleClickForPaymentElement}
            >
              {processing ? <div className="spinner" id="spinner"></div> : <span id="button-text">Save Checkout</span>}
            </button>
          </div>
          {(customer?.exist || sameEmail || customerFromSession().email) && (
            <>
              <div className="sr-field-error" id="customer-exists-error" role="alert">
                A customer with that email address already exists. If you'd like to update the card on file, please
                visit{' '}
                <span id="account_link">
                  <b>
                    <a href={`localhost:3000/account-update/${customerFromSession().customerId}`}>account update</a>
                  </b>
                </span>
                {'\n'}
                <span id="error_message_customer_email">{customer?.email}</span>.
              </div>
            </>
          )}
        </div>
        {error && (customer === null || !customer) && (
          <div className="sr-field-error" id="card-errors" role="alert">
            <div className="card-error" role="alert">
              {error}
            </div>
          </div>
        )}
      </div>
    )
  }
  return <div className="lesson-form">{body}</div>
}
export default RegistrationForm
