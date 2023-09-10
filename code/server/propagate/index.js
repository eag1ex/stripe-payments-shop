// custom propagate actionable scrips
/** @typedef {import('stripe').Stripe} Stripe */
require('dotenv').config({ path: '../.env' });


const { apiVersion, clientDir } = require('../config');
const { delay } = require('../utils');


/** @type {Stripe} */
const Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, { apiVersion });

Stripe.customers.list({limit:10000}).then(async(n) => {   
   const ids =  n.data.map(n=>n.id)
   for(const id of ids){
      try{
            await Stripe.customers.del(id)
            await delay(100)
            console.log('deleted', id)
        }catch(err){
            console.log('delete error', id,err)
        }
   }

})