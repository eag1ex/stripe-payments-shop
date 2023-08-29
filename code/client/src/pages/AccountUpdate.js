import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import UpdateCustomer from "../components/UpdateCustomer";
import "../css/lessons.scss";
import { accountUpdate } from "../Services/account";

//Component responsable to update user's info.
const AccountUpdate = ({ id }) => {
  const [data, setData] = useState({});

  //Get info to load page, User payment information, config API route in package.json "proxy"
  useEffect(() => {
    const setup = async () => {
      const result = await accountUpdate(id);
      if (result !== null) {
        setData(result);
      }
    };
    setup();
  }, [id]);

  const onSuccessfulConfirmation = async (customerId) => {
    const result = await accountUpdate(id);
    if (result !== null) {
      setData(result);
    }
  };

  return (
    <main className="main-lessons">
      <Header />
      {data.customer ? (
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
              <span id="billing-email">{data.customer.email}</span>
            </p>
            <p>
              Card Exp Month:&nbsp;&nbsp;
              <span id="card-exp-month">{data.card.exp_month}</span>
            </p>
            <p>
              Card Exp Year:&nbsp;&nbsp;
              <span id="card-exp-year">{data.card.exp_year}</span>
            </p>
            <p>
              Card last 4:&nbsp;&nbsp;
              <span id="card-last4">{data.card.last4}</span>
            </p>
          </div>
          <UpdateCustomer
            customerId={id}
            customerName={data.customer.name}
            customerEmail={data.customer.email}
            onSuccessfulConfirmation={onSuccessfulConfirmation}
          />
        </div>
      ) : (
        <div className="eco-items" id="account-information">
          <h3>Account not found!</h3>
        </div>
      )}
    </main>
  );
};

export default AccountUpdate;
