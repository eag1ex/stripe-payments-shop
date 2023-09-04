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