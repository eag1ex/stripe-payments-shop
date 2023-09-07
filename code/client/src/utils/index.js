import { BASE_URL } from "../constants";


export const urlPath = (Path) => {
    if (BASE_URL) {
        return new URL(Path, BASE_URL).toString()
    } else {
        return new URL(Path, window.location.href).hostname
    }
}

export const customerObject = (customer) => {
    return {
        id: customer.customerId,
        email: customer.customerEmail,
        name: customer.customerName,
    }
}

export const customerCardObject = (card) => {
    return {
       
    }
}

export const errorHandler = async (errResponse) => {

    try {
        const r = await errResponse.json() || {}
        if (typeof r.error === 'object') {
            if (r.error.message) {
                throw new Error(r.error.message)
            } else {
                throw new Error(JSON.stringify(r.error))
            }
        } else {
            throw new Error(JSON.stringify(r))
        }
    } catch (err) {
        throw new Error(err)
    }
}

// The payment has been processed!
export const checkoutResp = (d) => {
    try {
        return {
            card: d?.payment_method?.card,
            billing_details: d?.payment_method?.billing_details
        }
    } catch (err) {
    }
    return {}
}