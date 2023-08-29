import React from "react";

const Thanks = ({ state }) => {
  if (state) {
    return (
      <div className="sr-section completed-view video-thanks hidden">
        <div className="success">
          <img src="/assets/img/success.svg" alt="" />
        </div>
        <h3 id="order-status">Thank you for your order!</h3>
        <p>
          Payment Id: <span id="payment-id"></span>
        </p>
        <p>Please check your email for download instructions.</p>{" "}
        <button onClick={() => window.location.reload(false)}>
          Place Another Order
        </button>
      </div>
    );
  } else {
    return "";
  }
};

export default Thanks;
