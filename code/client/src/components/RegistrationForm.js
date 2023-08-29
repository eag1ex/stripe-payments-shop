import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { useEffect, useRef, useState } from "react";
import CardSetupForm from "./CardSetupForm";

const RegistrationForm = (props) => {
  const { selected, details } = props;
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [learnerEmail, setLearnerEmail] = useState("");
  const [learnerName, setLearnerName] = useState("");
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const stripePromise = useRef(null);
  let appearance = null;
  // TODO: Integrate Stripe

  const handleChange = async(value, field) => {
    //TODO: Handle the checkout event
  }

  const handleClickForPaymentElement = async () => {
    // TODO: Setup and Load Payment Element
  };


  let body = null;
  if (selected === -1) return body;
  if (clientSecret) {
    body = (
      <Elements stripe={stripePromise.current} options={{appearance, clientSecret}}>
      <CardSetupForm
        selected={selected}
        mode="setup"
        details={details}
        learnerEmail={learnerEmail}
        learnerName={learnerName}
        customerId={customerId}
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
        {existingCustomer && (
          <div
            className="sr-field-error"
            id="customer-exists-error"
            role="alert"
          >
            A customer with that email address already exists. If you'd
            like to update the card on file, please visit{" "}
            <span id="account_link">
              <b>
                <a
                  href={`localhost:3000/account-update/${existingCustomer.customerId}`}
                >
                  account update
                </a>
              </b>
            </span>
            {"\n"}
            <span id="error_message_customer_email">
              {existingCustomer.customerEmail}
            </span>
            .
          </div>
        )}
      </div>
      {error && existingCustomer === null && (
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
