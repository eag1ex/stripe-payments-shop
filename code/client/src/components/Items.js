import React from "react";
import SREItem from "./SREItem";

//Process each video course and generate html
const Items = (props) => {
  const items = props.items;
  const action = props.action;

  return (
    <div id="sr-items" className="video-body">
      {items.length === 0 ? (
        <h1>No items found {};</h1>
      ) : (
        items.map((item) => (
          <SREItem
            key={item.itemId}
            id={item.itemId}
            index={item.index}
            item={item.title}
            price={item.price}
            img={item.img}
            desc={item.desc}
            action={action}
            selected={item.selected}
          />
        ))
      )}
    </div>
  );
};

export default Items;
