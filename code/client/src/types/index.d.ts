import type { loadStripe, } from '@stripe/stripe-js'
import type { Stripe } from 'stripe'

export namespace CustomerType {
    export interface Update {
        secret: { setupIntent: string }
        customer: Stripe.Customer
        paymentMethodId: Stripe.PaymentMethod
    }
    export interface PaymentMethod extends Stripe.PaymentMethod {

    }

    /**onSuccessfulConfirmation */
    export interface CardSetupIntentConfirmation {
        card: Stripe.PaymentMethod.Card
        billing_details: Stripe.PaymentMethod.BillingDetails
        customerId: string
    }
}

