import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { useEffect, useRef, useState } from "react";
import CardSetupForm from "./CardSetupForm";

import { createCustomer } from '../Services/customer'
import { Link } from "react-router-dom";
import { serverConfig } from '../Services/config';
import { customerObject } from '../utils'

// it would be best to use environment variables, but i dont see that in code.client root, i do understand you want to call it from GET /config, so in order not to rerender the object we declare it before render, as advised in your docs, @source: https://stripe.com/docs/payments/save-and-reuse?platform=web&ui=elements



// const SERVER_CONFIG = (async () => {
//   try {
//     return (await serverConfig())
//   } catch (err) {
//     console.error('[SERVER_CONFIG][error]', err)
//   }
//   return undefined
// })()



const LoadStripe = (async () => {
  let stripePromise
  try {
   const STRIPE_PUBLISHABLE_KEY = (await serverConfig()).key
    stripePromise = await loadStripe(STRIPE_PUBLISHABLE_KEY);
  } catch (err) {

  }
  return stripePromise
})()


const RegistrationForm = (props) => {
  const { selected, details,session, onUpdate } = props;
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [learnerEmail, setLearnerEmail] = useState("");
  const [learnerName, setLearnerName] = useState("");
  const [customer, setCustomer] = useState(null);
  const stripePromise = useRef(LoadStripe);
  const appearance = {}



  const handleChange = async(value, field) => {

    if (field === "learnerEmail") setLearnerEmail(value);
    if (field === "learnerName") setLearnerName(value);
  }
  
  const handleClickForPaymentElement = async () => {
    if (
      !!learnerEmail && !!learnerName && !processing&&
      customer?.email === learnerEmail && customer?.name === learnerName) {
      setError(null)
        return false
    }

    setError(null);
    setProcessing(true)
    createCustomer({ learnerEmail, learnerName, metadata: session }).then(n=>{
      setProcessing(false)
      setCustomer({ clientSecret:n.clientSecret, customerId: n.customerId, email: n.email, name: n.name, card:n.card, exist: n.exist, metadata: n.metadata })

      if (typeof onUpdate ==='function' && n.exist){
        onUpdate('registration',n.metadata)
      }

    }).catch(e=>{
      console.log('[RegistrationForm][error]', e)
      setError(e.message)
    })
  };

  console.log('[RegistrationForm][session]', session)
  console.log('[RegistrationForm][customer]', customer)

  let body = null;
  if (selected === -1) return body;
  if (customer?.clientSecret && customer?.exist===false ) {

    body = (
      <Elements stripe={stripePromise.current} options={{ appearance, clientSecret: customer.clientSecret, theme:'stripe'}}>

        <CardSetupForm
          customer={customer}
          selected={selected}
          mode="setup"
          session={session}
          details={details}
        />
      
      </Elements>
    )
  } else {
    body = ( 
    <div className={`lesson-desc`}>
      <h3>Registration details</h3>
      <div id="summary-table" className="lesson-info">
        {details}
      </div>
      <div className="lesson-legal-info">
        Your card will not be charged. By registering, you hold a session
        slot which we will confirm within 24 hrs.
      </div>
      <div className="lesson-grid">
        <div className="lesson-inputs">
          <div className="lesson-input-box first">
            <label>Name</label>
            <input
              type="text"
              id="name"
              value={learnerName}
              placeholder="Name"
              autoComplete="cardholder"
              className="sr-input"
              onChange={(e) => handleChange(e.target.value, "learnerName")}
            />
          </div>
          <div className="lesson-input-box middle">
            <label>Email</label>
            <input
              type="text"
              id="email"
              value={learnerEmail}
              placeholder="Email"
              autoComplete="cardholder"
              onChange={(e) => handleChange(e.target.value, "learnerEmail")}
            />
          </div>
            <button
              id="checkout-btn"
              disabled={!learnerName || !learnerEmail || processing}
              onClick={handleClickForPaymentElement}
            >
              <span id="button-text">Checkout</span>
            </button>
        </div>
          {customer?.exist && (
          <div
            className="sr-field-error"
            id="customer-exists-error"
            role="alert"
          >
            A customer with that email address already exists. If you'd
            like to update the card on file, please visit{" "}

              <Link
                state={{ customer: customerObject(customer), card: customer?.card, metadata: customer.metadata }}
                id="account-link"
                to={`../account-update/${customer?.customerId}`}
              >
                <b>account update</b>
              </Link>
            {"\n"}
            <span id="error_message_customer_email">
                {customer?.email}
            </span>
            .
          </div>
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
};
export default RegistrationForm;


