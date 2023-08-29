import React from "react";
import ReactHtmlParser from "react-html-parser";
import { capitalize, getPriceDollars } from "./Util";

//Generate HTML for video course
const SREItem = (props) => {
  const { id, index, item, price, img, desc, action, selected } = props;

  return (
    <div className={`video-item ${selected ? " selected" : ""}`}>
      <div className="video-img">
        <img src={img} alt={item} />
      </div>

      <div className="video-title-text">{capitalize(item)}</div>

      <div className="video-desc-text">{ReactHtmlParser(desc)}</div>

      <button
        id={id}
        className={`video-button ${selected ? " selected" : ""}`}
        onClick={() => action(id, index)}
      >
        <span id="button-text">{getPriceDollars(price)}</span>
      </button>
    </div>
  );
};
export default SREItem;
