import React, { useState } from "react";
import {
    PaymentElement, useElements, useStripe, LinkAuthenticationElement, CardElement, AddressElement
} from "@stripe/react-stripe-js";
import { checkoutResp } from '../utils/index';


const CardCheckoutForm = (props) => {
    const [message, setMessage] = useState(null);
    const [status, setStatus] = useState('initial') // initial | loading | ready | exit
    const { customer,  onSuccessfulConfirmation } = props;
    const stripe = useStripe();
    const elements = useElements();

    const handleClick = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || status === 'loading') return;
        setStatus('loading')

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                
                elements,
                redirect:'if_required',
                confirmParams: {
                    expand: ['payment_method'], // add "customer" ?
                    save_payment_method: this,
                    payment_method_data: {

                        billing_details: {
                            email: customer.email,
                            name: customer.name,
                        }
                    },
                    // Make sure to change this to your payment completion page
                  // return_url: `${window.location.origin}/completion`,
                },
            })

          
            if (error?.type === "card_error" || error?.type === "validation_error") {
                console.log(error.message);
                setMessage(error.message);
                setStatus('initial')
                return 
            }
            if (error) {
                // Show error to your customer (for example, insufficient funds)
                console.log(error.message);
                if (typeof onSuccessfulConfirmation === 'function') onSuccessfulConfirmation('setup-error', error.message)
                setStatus('initial')
                setMessage(error.message);
                return
            }
            
            // The payment has been processed!
            onSuccessfulConfirmation('success', checkoutResp({ ...paymentIntent }))

        } catch (err) {
            setStatus('initial')
            onSuccessfulConfirmation('pm-error', err)
        }

    };


    return (<form onSubmit={handleClick}>
        <div style={{ marginBottom: 20, marginTop: 5, }}>
            {/* <LinkAuthenticationElement id="link-authentication-element"
            // Access the email value like so:
            onChange={(event) => {
                console.log('LinkAuthenticationElement/value', event.value)
            }}
                options={{ defaultValues: { email: customer.email, name: customer.name  }}}
            /> */}
            <PaymentElement className="card" options={{
                paymentMethodOrder: ['card'],
                defaultValues: { billingDetails: { name: customer.name, email: customer.email } }, layout: { type: "tabs" },

            }} />


            {/* <div id="card-element" className="card" style={{  marginBottom: 10 }}>
                <div  className="lesson-info smaller" style={{ marginTop: 5, marginBottom:10 }}>
                    Card details
                </div>
                <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>


            <div id="address-element" className="card-address" >
                <div className="lesson-info smaller" style={{ marginTop: 5, marginBottom: 10 }}>
                    Billing Address
                </div>
                <AddressElement onReady={(e)=>{
                    console.log('eeee is', e)
                }} options={{ defaultValues: { name: customer.name || '' }, display: { name: 'full', }, allowedCountries: ['US', 'TH'], mode: 'billing', autocomplete: { mode: 'automatic' }, fields: { address: {line1:'never'} } }} />

            </div> */}


            <button id="submit" disabled={!stripe || status === 'loading'}>  {status === 'loading' ? (
                <div className="spinner" id="spinner"></div>
            ) : (
                <span id="button-text">Confirm initial payment</span>
            )}</button>
            {/* {message && <div id="payment-message" className="lesson-info smaller" style={{marginTop:5}}>{message}</div>} */}
            {message && (
                <div className="sr-field-error" id="card-errors" role="alert">
                    <div className="card-error" role="alert">
                        {message}
                    </div>
                </div>
            )}    

        </div>

    </form>)

}

export default CardCheckoutForm
