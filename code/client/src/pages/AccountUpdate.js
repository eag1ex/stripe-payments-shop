/**
 * @typedef {import('../types').CustomerType.Update} CustomerUpdate
 * @typedef {import('../types').CustomerType.PaymentMethod} CustomerPaymentMethod
 * @typedef {import('../types').CustomerType.CardSetupIntentConfirmation} CardSetupIntentConfirmation
 */

import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import UpdateCustomer from '../components/UpdateCustomer'

import '../css/lessons.scss'
import { getCustomer } from '../Services/account'
import { useMatch } from 'react-router-dom'
import DocumentTitle from '../components/DocumentTitle'
import { setCustomerSession } from '../utils'

const AccountUpdate = () => {
  DocumentTitle('Account Details')

  const id = useMatch('/account-update/:id').params.id
  const [status, setStatus] = useState('initial') // loading, error, success

  /** @type {[CustomerPaymentMethod, React.Dispatch<CustomerPaymentMethod>]}  */
  const [customerData, setCustomerData] = useState(null)

  useEffect(() => {
    if (id && status === 'initial') {
      setStatus('loading')
      getCustomer(id)
        .then((r) => {
          setCustomerData(r)
          setStatus('success')
        })
        .catch((e) => {
          setStatus('error')
        })
    }
  }, [id])

  console.log('data.customer', customerData?.customer)

  /**
   *
   * @param {*} customerId
   * @param {CardSetupIntentConfirmation} resp
   * @returns
   */
  const customerUpdateConfirmation = async (customerId, resp) => {
    if (!resp || !customerId) return
    // this updates the customer's email and name only
    const customerDataCopy = { ...customerData }
    customerDataCopy.customer.email = resp.billing_details.email
    customerDataCopy.customer.name = resp.billing_details.name
    customerDataCopy.card = resp.card
    setCustomerData(JSON.parse(JSON.stringify(customerDataCopy)))
    setCustomerSession({ name: resp.billing_details.name, email: resp.billing_details.email, customerId })
  }

  return (
    <main className="main-lessons">
      <Header />
      {!!customerData?.customer ? (
        <div>
          <div className="eco-items" id="account-information">
            {
              //User's info shoul be display here
            }
            <h3>Account Details</h3>
            <h4>Current Account information</h4>
            <h5>We have the following card information on file for you: </h5>
            <p>
              Billing Email:&nbsp;&nbsp;
              <span id="billing-email">{customerData?.customer?.email}</span>
            </p>
            <p>
              Card Exp Month:&nbsp;&nbsp;
              <span id="card-exp-month">{customerData?.card?.exp_month}</span>
            </p>
            <p>
              Card Exp Year:&nbsp;&nbsp;
              <span id="card-exp-year">{customerData?.card?.exp_year}</span>
            </p>
            <p>
              Card last 4:&nbsp;&nbsp;
              <span id="card-last4">{customerData?.card?.last4}</span>
            </p>
          </div>
          <UpdateCustomer
            customer={customerData.customer}
            customerName={customerData.customer.name}
            customerEmail={customerData.customer.email}
            customerUpdateConfirmation={(status, resp) => {
              customerUpdateConfirmation(customerData.id, resp)
            }}
          />
        </div>
      ) : (
        <div className="eco-items" id="account-information">
          <h3>Account not found!</h3>
        </div>
      )}
    </main>
  )
}

export default AccountUpdate
