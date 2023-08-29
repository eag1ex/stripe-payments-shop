var getPriceDollars = (price, decimal = false, recurringBy = undefined) => {
  if (decimal) {
    price = Math.round(price / 100.0).toFixed(2);
  } else {
    price = Math.round(price / 100.0);
  }
  var pricePart = "$" + price;
  if (recurringBy === undefined) {
    return pricePart;
  } else {
    return pricePart + "/" + recurringBy;
  }
};

var capitalize = (itemName) => {
  return itemName.charAt(0).toUpperCase() + itemName.slice(1);
};

exports.getPriceDollars = getPriceDollars;
exports.capitalize = capitalize;
