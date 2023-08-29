import React from "react";
import { Link } from "@reach/router";

//Home item card
const SRECard = (props) => {
  const { id, title, desc, img, route } = props;

  return (
    <div className="sr-item">
      <div className="eco-product-img">
        <img src={`${process.env.PUBLIC_URL}${img}`} alt="" />
      </div>
      <div className="sr-item-text">{title}</div>
      <div className="eco-desc-text">{desc}</div>
      <Link to={route}>
        <button id={id}>Sign Up</button>
      </Link>
    </div>
  );
};

export default SRECard;
