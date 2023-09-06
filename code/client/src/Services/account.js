import { errorHandler } from "../utils";

// Get info to load page, User payment information
export const accountUpdate = async (id) => {
  const response = await fetch(`/api/payment-method/${id}`, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    console.log(response);
    console.log("Account Update: Error happened while fetching data");
    return await errorHandler(response);
  }
  const data = await response.json();
  return data;
};


