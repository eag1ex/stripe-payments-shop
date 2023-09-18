/** @typedef {import('stripe').Stripe.Invoice} Invoice*/
/** @typedef {import('stripe').Stripe} Stripe*/

const moment = require('moment')

/**
 * 
 * @param {Stripe} stripe 
 * @param {*} object 
 * @param {*} eventType 
 * @returns 
 */

exports.webhookInvoice = async (stripe, object, eventType) => {
  // try to manually invoice customer if its due
  // Use the Payment Intents API to initiate a new payment instead of using this method. Confirmation of the PaymentIntent creates the Charge object used to request payment, so this method is limited to legacy integrations.

  if (eventType === 'invoice.created') {
    try {
      /** @type {Invoice} */
      const inv = object

      // invoice Placing a hold on a payment
      // https://stripe.com/docs/billing/invoices/subscription#placing-a-hold-on-a-payment
      console.log('[webhook][object][date] ', moment.unix(inv.created).toString())

      const { type } = inv?.subscription_details?.metadata

      if (type === 'invoice_and_charge') {
        return
      }

      // retrieve customer
      const customer = (async () => {
        try {
          const cus = await stripe.customers.retrieve(inv.customer)
          if (cus.deleted) throw Error(`customer deleted: ${inv.customer}`)
          return cus
        } catch (err) {}
      })()

      if (!customer) return

      const paymentMethod = await (async () => {
        try {
          return (
            await stripe.paymentMethods.list({
              customer: inv.customer,
              type: 'card',
              expand: ['data.customer'],
            })
          ).data[0]
        } catch (er) {
          console.error('[paymentMethods][error]', er)
        }
      })()

      // on 5th day
      if (type === 'auth_pending_payment') {
        try {
          // create new intent with capture_method:manual
          const piCreate = await stripe.paymentIntents.create({
            amount: Number(inv.subscription_details.metadata.amount_capturable),
            currency: inv.currency,
            confirm: false,
           // application_fee_amount:123,
            receipt_email: paymentMethod.customer.email,
            customer: inv.customer,
            description: inv.description,
            payment_method: paymentMethod.id,
            capture_method: 'manual',
            setup_future_usage: 'off_session',
            metadata: {
              ...paymentMethod.customer.metadata,
              type,
              invoice_id: inv.id,
            },
          })

          const paymentIntentConfirm = await stripe.paymentIntents.confirm(piCreate.id, {
            payment_method: 'pm_card_visa',
            capture_method: 'manual',
            setup_future_usage: 'off_session',
          })
          console.log('[auth_pending_payment][paymentIntentConfirm]', paymentIntentConfirm.id)
        } catch (err) {
          console.error('[auth_pending_payment][error]', err)
        }
      }
    } catch (err) {}
  }
}
