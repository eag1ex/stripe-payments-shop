import { APIRequestContext } from "@playwright/test";

export const stripeRequest = async (request, method, route, timeout?) => {
  const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
  }

  const response = await request.fetch(`https://api.stripe.com/v1/${route}`, { headers, method, timeout });

  return await response.json();
}

export const serverRequest = async (request: APIRequestContext, method, route, data?, timeout?) => {
  const response = await request.fetch(`${process.env.DOMAIN}/${route}`, { data, method, timeout } );

  return await response.json();
}