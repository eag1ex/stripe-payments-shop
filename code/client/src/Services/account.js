import { errorHandler } from "../utils";

/**
 * Get customer payment information and metadata
 * @param {*} id
 * @returns
 */
export const getCustomer = async (id) => {
  const response = await fetch(`/api/payment-method/${id}`, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    console.log(response);
    console.log("getCustomer: Error happened while fetching data");
    return await errorHandler(response);
  }
  const data = await response.json();
  return data;
};
