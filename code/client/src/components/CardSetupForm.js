import React, { useState } from "react";
import SignupComplete from "./SignupComplete";
import CardCheckoutForm from './CardCheckoutForm';




  const CardSetupForm = (props) => {
    const { session, selected, mode, details,customer, onSuccessfulConfirmation } =
      props;
      
    const [paymentSucceeded, setPaymentSucceeded] = useState(false);
    const [error, setError] = useState(null);
    const [last4, setLast4] = useState("");


    if (selected === -1) return null;
    if (paymentSucceeded) return (
      <div className={`lesson-form`}>
        <SignupComplete
          active={paymentSucceeded}
          email={customer?.email}
          last4={last4}
          customer_id={customer?.customerId}
        />
      </div>
    )
    return (
      // The actual checkout form, inside the !paymentSucceeded clause
        <div className={`lesson-form`}>
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
                <span>{customer?.name} ({customer?.email})</span>
                  </div>
                  <div className="lesson-payment-element">
             
                   
                <CardCheckoutForm state={'setup'} customer={customer} session={session}/>
                  </div>
                </div>
              </div>
              {error && (
                <div className="sr-field-error" id="card-errors" role="alert">
                  <div className="card-error" role="alert">
                    {error}
                  </div>
                </div>
              )}
            </div>
        </div>
    )
  };
  export default CardSetupForm;
  