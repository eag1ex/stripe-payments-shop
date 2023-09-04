
import { urlPath } from '../utils/index';

// Get info to load page, User payment information
export const accountUpdate = async (id) => {
  const response = await fetch(urlPath(`/payment-method/${id}`), {
    method: "get",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    console.log(response);
    console.log("Account Update: Error happened while fetching data");
    return null;
  }
  const data = await response.json();
  return data;
};


