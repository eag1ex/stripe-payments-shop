import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import UpdateCustomer from "../components/UpdateCustomer";

import "../css/lessons.scss";
import { getCustomer } from "../Services/account";
// import { useLocation } from "react-router-dom";
import { useMatch } from "react-router-dom";
import DocumentTitle from "../components/DocumentTitle";

//Component responsable to update user's info.
const AccountUpdate = () => {
  DocumentTitle("Account Details");
  const [status, setStatus] = useState("initial"); // loading, error, success

  //const { pathname, hash, key, state } = useLocation();
  // const customerData = state?.customer;

  const id = useMatch("/account-update/:id").params.id;
  const [data, setData] = useState(null);

  console.log("[AccountUpdate][route]", id);

  useEffect(() => {
    if (id && status === "initial") {
      setStatus("loading");
      getCustomer(id)
        .then((r) => {
          setData(r);
          setStatus("success");
        })
        .catch((e) => {
          setStatus("error");
        });
    }
  }, [id]);

  console.log("data.customer", data?.customer);

  const onSuccessfulConfirmation = async (customerId) => {
    // const result = await accountUpdate(id);
    // if (result !== null) {
    //   setData(result);
    // }
  };

  return (
    <main className="main-lessons">
      <Header />
      {!!data?.customer ? (
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
              <span id="billing-email">{data?.customer?.email}</span>
            </p>
            <p>
              Card Exp Month:&nbsp;&nbsp;
              <span id="card-exp-month">{data?.card?.exp_month}</span>
            </p>
            <p>
              Card Exp Year:&nbsp;&nbsp;
              <span id="card-exp-year">{data?.card?.exp_year}</span>
            </p>
            <p>
              Card last 4:&nbsp;&nbsp;
              <span id="card-last4">{data?.card?.last4}</span>
            </p>
          </div>
          <UpdateCustomer
            customer={data.customer}
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
