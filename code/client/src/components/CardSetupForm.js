/** @typedef {import('stripe').Stripe.SetupIntent} StripeSetupIntent */
/** @typedef {import('../types').CustomerType.CardSetupIntentConfirmation} CardSetupIntentConfirmation*/

import React, { useState } from 'react'
import SignupComplete from './SignupComplete'
import CardCheckoutForm from './CardCheckoutForm'

const CardSetupForm = (props) => {
  const { session, selected, type, details, customer } = props

  /** @type {[CardSetupIntentConfirmation, React.Dispatch<CardSetupIntentConfirmation>]}  */
  const [billingData, setBillingData] = useState(null)

  if (selected === -1 && type === 'create') return null
  if (!!billingData && type === 'create')
    return (
      <div className={`lesson-form`}>
        <SignupComplete
          active={!!billingData}
          email={billingData.billing_details?.email}
          last4={billingData.card.last4}
          customer_id={billingData?.customerId}
        />
      </div>
    )
  return (
    <div className={`lesson-form`}>
      <div className={`lesson-desc`}>
        <>
          <h3>Registration details</h3>
          <div id="summary-table" className="lesson-info">
            {details}
          </div>
          <div className="lesson-legal-info">
            Your card will not be charged. By registering, you hold a session slot which we will confirm within 24 hrs.
          </div>
        </>

        <div className="lesson-grid">
          <div className="lesson-inputs">
            <div className="lesson-input-box first">
              <span>
                {customer?.name} ({customer?.email})
              </span>
            </div>
            <div className="lesson-payment-element">
              <CardCheckoutForm
                type={type}
                customer={customer}
                // LessonSession type
                session={session}
                /**
                 * @param {StripeSetupIntent} result
                 */
                onSuccessfulConfirmation={(eventType, status, result) => {
                  /** @type {CardSetupIntentConfirmation} */
                  const r = result

                  // customerUpdateConfirmation
                  if (eventType !== type) return

                  if (eventType === 'create') {
                    if (status === 'success') {
                      setBillingData(r)
                    }

                    if (status === 'pm-error') {
                      console.error('pm-error', r)
                    }
                    if (status === 'setup-error') {
                      console.error('setup-error', r)
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* {error && (
                <div className="sr-field-error" id="card-errors" role="alert">
                  <div className="card-error" role="alert">
                    {error}
                  </div>
                </div>
              )} */}
      </div>
    </div>
  )
}
export default CardSetupForm
