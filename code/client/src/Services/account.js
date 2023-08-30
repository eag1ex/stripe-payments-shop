import { BASE_URL } from "../config";


const url = (Path)=>{
  if (BASE_URL){
    return new URL(Path, BASE_URL).toString()
  } else{
    return new URL(Path, window.location.href).hostname
  }

}


export const accountUpdate = async (id) => {
  const response = await fetch(`/payment-method/${id}`, {
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


export const createCustomer = async ({ learnerEmail, learnerName }) => {
  const response = await fetch(url('/lessons'), {
    method: "post",
    headers: {
      'Accept': 'application/json',
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ learnerEmail, learnerName })
  });
  if (!response.ok) {
    console.log(response);
    console.log("Account Update: Error happened while fetching data");
    return null;
  }
  const data = await response.json();
  return data;
};


