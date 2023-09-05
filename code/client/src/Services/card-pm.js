/**
 * Get card payment details
 * @api {{baseUrl}}/v1/payment_methods/:payment_method
 * @param {*} id 
 * @returns 
 */
export const cardPm = async (payment_method) => {
    const response = await fetch(`/api/card/${payment_method}`, {
        method: "get",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        console.log(response);
        console.log("Card pm: Error happened while fetching data");
        return null;
    }
    const data = await response.json();
    return data;
};
