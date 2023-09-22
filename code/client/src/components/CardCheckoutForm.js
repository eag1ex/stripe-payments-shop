import React, { useEffect, useState } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { checkoutResp,setCustomerSession, customerFromSession } from '../utils/index'
import { customerAccountUpdate } from 'src/Services/account'
 
const CardCheckoutForm = (props) => {
  const { customer, onSuccessfulConfirmation, type } = props // type = 'create' | 'update'
  const [message, setMessage] = useState(null)
  const [status, setStatus] = useState('initial') // initial | loading | ready | exit
  const stripe = useStripe()
  const elements = useElements()

  console.log('[CardCheckoutForm]1','',customerFromSession()?.timestamp)
  console.log('[CardCheckoutForm]2','',customer.metadata?.timestamp)


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

      // ------------------------
      // update customer metadata if it changed during new card setup
      let updated = false

      try {

        if (
          type==='create' &&
          customerFromSession()?.timestamp !==customer?.metadata?.timestamp
        ) {
          customerAccountUpdate(customer.customerId,{metadata:customer.metadata}).then((n) => {

            // -- callback hook after updating user to when new payment setup was created
            onSuccessfulConfirmation(type, 'success', checkoutResp({ ...setupIntent }))
            // ----------------


            setCustomerSession({ name: n.customer.name, email: n.customer.email, customerId: n.customer.id,timestamp:n.customer.metadata.timestamp})

          }).catch(err=>{
            console.error('[CardCheckoutForm][updateCustomerMetadata][error]',err)
          })
          updated = true
        }
      } catch (err) {}

      // if customer data was not updated then just follow normal flow
      if(!updated ) {
        // -- callback hook  when new payment setup was created and we did not update customer metadata
        onSuccessfulConfirmation(type, 'success', checkoutResp({ ...setupIntent }))
      }

      //---------------------------------

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
