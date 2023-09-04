import React from "react";
import {
    PaymentElement, useElements, useStripe, CardElement
} from "@stripe/react-stripe-js";
import CardSection from "./CardSection";




const CardCheckoutForm = (props) => {

    const { state,customer, session, onSuccessfulConfirmation } = props;
    const stripe = useStripe();
    const elements = useElements();

    // console.log('CardCheckoutForm/stripe', stripe)
    // console.log('CardCheckoutForm/elements', elements)
    // console.log('clientSecret', clientSecret)
    // console.log('[customerId]', customerId)

    // todo we need to change this handler
    const handleClick = async (e) => {


        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
        }

        const result = await stripe.confirmCardSetup(customer?.clientSecret, {

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



        if (result.error) {
            // Show error to your customer (for example, insufficient funds)
            console.log(result.error.message);
        } else {

            // The payment has been processed!
            if (result.setupIntent.status === 'succeeded') {
                // Show a success message to your customer
                // There's a risk of the customer closing the window before callback
                // execution. Set up a webhook or plugin to listen for the
                // payment_intent.succeeded event that handles any business critical
                // post-payment actions.
                console.log('success', result.setupIntent)
            }
        }
    };



    return (<form onSubmit={handleClick}>
        <CardSection state={state} />
        <button disabled={!stripe}>Confirm order</button>
    </form>)
    
}

export default CardCheckoutForm
