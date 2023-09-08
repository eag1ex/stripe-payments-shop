exports.customerMetadata = ({ type, date, time, }) => {
    return {
        // to satisfy stripe's metadata requirements
        first_lesson: date,
        type,
        date,
        time
    }
}

/**
 * @description search for customer, if it exists check if it has a payment method is assigned to it
 * @returns 
 */
exports.customerExists = async(stripe,{ learnerName, learnerEmail }) => {
    try {

        // /**
        //  * @returns {customer, card} || undefined
        //  */
        const listPaymentMethod = async()=>{
         return (await stripe.customers.listPaymentMethods(
                customer_id,
             { type: 'card', expand: ['data.customer'] }
            ))?.data[0]
        }
        // stripe.paymentIntents.list({ customer: 'cus_Oa4fBHkgqlcREw', expand: ['data.customer'] }).then(n => {
        //     console.log('cus2', n)
        // })
        
        let cus
        // `name:"${learnerName}" AND email:"${learnerEmail}"`
        cus = await stripe.customers.search({ query: `email:"${learnerEmail}"`, expand: [] })
        const customer_id = cus.data?.length ? cus.data[0].id : null
        let exist = !!customer_id
        if (customer_id) {

            console.log('[customerExists]', { customer_id, name: cus.data[0].name, email: cus.data[0].email})

            const paymentList = await listPaymentMethod(customer_id)
            if (paymentList) {
                cus = { data: [{ ...paymentList, ...cus.data[0] }]}
                exist = true
            }
        }
      
        return { data: cus.data[0] ? [cus.data[0]] : [], exist }
        // 
    } catch (e) {
        console.error('[customerExists][error]', e)
    }
    return { data: [] }
}


/**
 * 
 * @returns stripe.setupIntents.list.data[0]
 */
exports.findCustomerSetupIntent = async (stripe, customer_id) => {

    try {
        return (await stripe.setupIntents.list({
            customer: customer_id
        }))?.data[0] ||{}
    } catch (err) {

    }
    return {}

}

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
