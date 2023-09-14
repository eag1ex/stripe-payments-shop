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

/**
 * @description search for customer, if it exists check if it has a payment method is assigned to it
 * @returns
 */
// exports.customerExists = async (stripe, { learnerName, learnerEmail }) => {
//   try {
//     // /**
//     //  * @returns {customer, card} || undefined
//     //  */
//     const listPaymentMethod = async (customer_id) => {
//       return (
//         await stripe.customers.listPaymentMethods(customer_id, {
//           type: "card",
//           expand: ["data.customer"],
//         })
//       )?.data[0];
//     };
//     // stripe.paymentIntents.list({ customer: 'cus_Oa4fBHkgqlcREw', expand: ['data.customer'] }).then(n => {
//     //     console.log('cus2', n)
//     // })

//     let cus;
//     // `name:"${learnerName}" AND email:"${learnerEmail}"`
//     cus = await stripe.customers.search({
//       query: `email:"${learnerEmail}"`,
//       expand: [],
//     });
//     const customer_id = cus.data?.length ? cus.data[0].id : null;
//     let exist = !!customer_id;
//     if (customer_id) {
//       console.log("[customerExists]", {
//         customer_id,
//         name: cus.data[0].name,
//         email: cus.data[0].email,
//       });

//       const paymentList = await listPaymentMethod(customer_id);
//       if (paymentList) {
//         cus = { data: [{ ...paymentList, ...cus.data[0] }] };
//         exist = true;
//       }
//     }

//     return { data: cus.data[0] ? [cus.data[0]] : [], exist };
//     //
//   } catch (e) {
//     console.error("[customerExists][error]", e);
//   }
//   return { data: [] };
// };

/**
 *
 * @returns stripe.setupIntents.list.data[0]
 */
// exports.findCustomerSetupIntent = async (stripe, customer_id) => {
//   try {
//     return (
//       (
//         await stripe.setupIntents.list({
//           customer: customer_id,
//         })
//       )?.data[0] || {}
//     );
//   } catch (err) {}
//   return {};
// };

// exports.createOrUpdateSetupIntent = async (stripe, customer_id,{ learnerName, learnerEmail, metadata }) => {

//     let setupIntents

//     try{
//         // find intent and get clientSecret
//         setupIntents = await stripe.setupIntents.list({
//             customer: customer_id
//         })
//     }catch(err){

//     }

//     try{

//     }catch(err){

//     }

// }

// setupIntent = await stripe.setupIntents.create({
//     customer: r.id,
//     metadata: meta,
//     automatic_payment_methods: {
//         enabled: true,
//     },
// });

/**
 * lets unset payment intent {capture_method} and reassign pm to new intent so we can update the flow later
 * 1. create new payment intent using existing payment method and metadata
 * 2. cancel old payment intent
 * @param {Stripe} stripe
 * @param {PaymentIntent} obj
 * @returns {Promise<string>} customerId
 */
// exports.reAssignPaymentIntent = async (stripe, obj) => {
//   let customerId = "";

//   const newpi = await stripe.paymentIntents.create({
//     amount: obj.amount,
//     payment_method:
//       typeof obj.payment_method === "string"
//         ? obj.payment_method
//         : obj?.payment_method?.id,
//     payment_method_types: obj.payment_method_types,
//     setup_future_usage: obj.setup_future_usage,
//     metadata: { ...obj.metadata, status: "continue" },
//     currency: obj.currency,
//     customer:
//       typeof obj.customer === "string" ? obj.customer : obj?.customer?.id,
//     receipt_email: obj.receipt_email,
//   });

//   // console.log(
//   //   "[payment_intent.amount_capturable_updated][newpi]",
//   //   JSON.stringify(newpi, null, 1)
//   // );
//   customerId =
//     typeof newpi.customer === "string" ? newpi.customer : newpi?.customer?.id;
//   try {
//     await stripe.paymentIntents.cancel(obj.id);
//   } catch (err) {
//     console.error("[payment_intent][cancel]", err);
//   }
//   return customerId;
// };

/**
 * lets unset payment intent {capture_method} and reassign pm to new intent so we can update the flow later
 * 1. create new payment intent using existing payment method and metadata
 * 2. cancel old payment intent
 * @param {Stripe} stripe
 * @param {string} customerId
 */
// exports.reAssignPaymentIntentByCustomerId = async (stripe, customerId) => {
//   const obj = (
//     await stripe.paymentIntents.search({
//       query: `customer:'${customerId}' AND status:'requires_capture'`,
//     })
//   ).data[0];

//   if (!obj) {
//     console.log(
//       `[reAssignPaymentIntentByCustomerId]",
//         "no paymentIntents for ${customerId} found`
//     );
//     return false;
//   }

//   const newpi = await stripe.paymentIntents.create({
//     amount: obj.amount,
//     payment_method:
//       typeof obj.payment_method === "string"
//         ? obj.payment_method
//         : obj?.payment_method?.id,
//     payment_method_types: obj.payment_method_types,
//     setup_future_usage: obj.setup_future_usage,
//     metadata: { ...obj.metadata, status: "continue" },
//     currency: obj.currency,
//     customer:
//       typeof obj.customer === "string" ? obj.customer : obj?.customer?.id,
//     receipt_email: obj.receipt_email,
//   });

//   console.log(
//     "[payment_intent.amount_capturable_updated][newpi]",
//     JSON.stringify(newpi, null, 1)
//   );

//   try {
//     await stripe.paymentIntents.cancel(obj.id);
//   } catch (err) {
//     console.error("[payment_intent][cancel]", err);
//   }
//   return true;
// };
