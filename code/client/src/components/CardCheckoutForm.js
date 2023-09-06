import React from "react";
import {
    PaymentElement, useElements, useStripe, CardElement
} from "@stripe/react-stripe-js";
import CardSection from "./CardSection";
import {cardPm} from '../Services/card-pm'



const CardCheckoutForm = (props) => {
    const [loading, setLoading]= React.useState(null)
    const { state,customer, session, onSuccessfulConfirmation } = props;
    const stripe = useStripe();
    const elements = useElements();

    // console.log('CardCheckoutForm/stripe', stripe)
    // console.log('CardCheckoutForm/elements', elements)
    // console.log('clientSecret', clientSecret)
    // console.log('[customerId]', customerId)
        // **
     
    // const secrets = {
    //   paymentIntent: paymentIntent?.client_secret,
    //   setupIntent: setupIntent?.client_secret
    // }
    //   * /


    // todo we need to change this handler
    const handleClick = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
        }
        setLoading(true)

        // 
        // stripe.confirmCardSetup
        
        const r1 = await stripe.confirmCardSetup(customer?.secrets?.setupIntent, {
            payment_method: {
                metadata: {
                    type: `${session.id}_lesson`,
                    date: session.date,
                    time: session.time,
                },
                card: elements.getElement(CardElement),
                billing_details: {
                    email: customer.email,
                    name: customer.name,
                },
            },
        })
       
        // console.log(' r1.setupIntent.client_secret', r1.setupIntent.client_secret)
        // const r2 = await stripe.confirmCardPayment(r1.setupIntent.client_secret, {
        //     card: elements.getElement(CardElement),
        //     billing_details: {
        //         email: customer.email,
        //         name: customer.name,
        //     }
        // })
       
        if (r1.error) {
            // Show error to your customer (for example, insufficient funds)
            console.log(r1.error.message);
            if (typeof onSuccessfulConfirmation === 'function') onSuccessfulConfirmation('setup-error', r1.error)
            setLoading(false)
        }
        // The payment has been processed!
        if (r1?.setupIntent?.status === 'succeeded') {

            // Show a success message to your customer
            // There's a risk of the customer closing the window before callback
            // execution. Set up a webhook or plugin to listen for the
            // payment_intent.succeeded event that handles any business critical
            // post-payment actions.
           const { payment_method } = r1.setupIntent

           cardPm(payment_method).then(n=>{
               if (typeof onSuccessfulConfirmation === 'function') onSuccessfulConfirmation('success', n)
               setLoading(false)
           }).catch(e=>{
               onSuccessfulConfirmation('pm-error',e)
               setLoading(false)
           })
        }
    };


    return (<form onSubmit={handleClick}>
        <CardSection state={state} />
        <button id="submit" disabled={!stripe || loading === true}>  {loading ? (
            <div className="spinner" id="spinner"></div>
        ) : (
            <span id="button-text">Save card</span>
        )}</button>
    </form>)
    
}

export default CardCheckoutForm
