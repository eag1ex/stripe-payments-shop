import React, { useState } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { checkoutResp } from '../utils/index'

const CardCheckoutForm = (props) => {
  const [message, setMessage] = useState(null)
  const [status, setStatus] = useState('initial') // initial | loading | ready | exit
  const { customer, onSuccessfulConfirmation, type } = props // type = 'create' | 'update'
  const stripe = useStripe()
  const elements = useElements()

  const handleClick = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    if (status === 'loading') return

    setStatus('loading')
    try {
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: {
          payment_method_data: {
            billing_details: {
              // if new email is not set then use the old one
              email: customer.email,
              name: customer.name,
            },
          },
          expand: ['payment_method'],
        },
      })

      if (error?.type === 'card_error' || error?.type === 'validation_error') {
        console.log(error.message)
        setMessage(error.message)
        setStatus('initial')
        return
      }
      if (error) {
        // Show error to your customer (for example, insufficient funds)
        console.error(error)
        if (typeof onSuccessfulConfirmation === 'function') onSuccessfulConfirmation(type, 'setup-error', error.message)
        setStatus('initial')
        setMessage(error.message)
        return
      }
      onSuccessfulConfirmation(type, 'success', checkoutResp({ ...setupIntent }))
    } catch (err) {
      setStatus('initial')
      onSuccessfulConfirmation(type, 'pm-error', err)
    }
  }

  if (!customer) return null

  return (
    <form onSubmit={handleClick}>
      <div style={{ marginBottom: 20, marginTop: 5 }}>
        <PaymentElement
          className="card"
          options={{
            paymentMethodOrder: ['card'],
            defaultValues: {
              billingDetails: { name: customer.name, email: customer.email },
            },
            layout: { type: 'tabs' },
          }}
        />

        <button id="submit" disabled={!stripe || status === 'loading'}>
          {' '}
          {status === 'loading' ? <div className="spinner" id="spinner"></div> : <span id="button-text">Confirm</span>}
        </button>
        {/* {message && <div id="payment-message" className="lesson-info smaller" style={{marginTop:5}}>{message}</div>} */}
        {message && (
          <div className="sr-field-error" id="card-errors" role="alert">
            <div className="card-error" role="alert">
              {message}
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

export default CardCheckoutForm
