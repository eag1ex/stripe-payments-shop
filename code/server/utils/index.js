/** @typedef {import('stripe').Stripe.errors} StripeErrors */
/** @typedef {import('stripe').Stripe} Stripe */
/** @typedef {import('stripe').Stripe.PaymentIntent} PaymentIntent */
/** @typedef {import('stripe').Stripe.PaymentIntent.Status} PaymentIntentStatus */

exports.customerMetadata = ({ type, date, time,timestamp }) => {
  return {
    // to satisfy stripe's metadata requirements
    first_lesson: date,
    type,
    date,
    time,
    timestamp
  };
};

exports.delay = (time = 0) => {
  const isNum = typeof time === "number" && time >= 0; // must provide number
  if (!isNum) return Promise.resolve(true); // or resolve
  // @ts-ignore
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      clearTimeout(t);
      resolve(true);
    }, time);
  });
};

