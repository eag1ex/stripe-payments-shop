/**
* Use the CSS tab above to style your Element's container.
*/
import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';
// import './CardSectionStyles.css'

const CARD_ELEMENT_OPTIONS = {
    theme: 'stripe',

    style: {
        base: {

            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": {
                color: "#aab7c4",
            },
        },
        invalid: {
            color: "#fa755a",
            iconColor: "#fa755a",
        },
    },
};

function CardSection({state}) {
    return (
        <>
            <div className='lesson-legal-info' style={{ paddingBottom: 10 }}>
                Card details
            </div>
            <CardElement className="card" options={CARD_ELEMENT_OPTIONS} />
        </>
    );
};





export default CardSection;