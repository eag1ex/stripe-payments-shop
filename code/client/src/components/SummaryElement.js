import React from "react";
import { capitalize, getPriceDollars } from "./Util";

const SummaryElement = ({ id, rowClass, desc, amountCents }) => {
  return (
    <div className="summary-row">
      <div id={id} className={`${rowClass} summary-title`}>
        {capitalize(desc)}
      </div>
      <div className={`${rowClass} summary-price`}>
        {getPriceDollars(amountCents)}
      </div>
    </div>
  );
};

export default SummaryElement;
