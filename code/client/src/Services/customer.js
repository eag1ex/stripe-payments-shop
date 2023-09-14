import { errorHandler } from '../utils'

const metaData = ({ type, date, time,timestamp }) => {
  return {
    type,
    date,
    time,
    timestamp
  }
}

export const createCustomer = async ({ learnerEmail, learnerName, metadata }) => {
  // customer metadata is LessonSession
  const response = await fetch('/api/lessons', {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ learnerEmail, learnerName, metadata: metaData(metadata) }),
  })
  if (!response.ok) {
    console.error('[createCustomer]: Error happened while fetching data')
    return await errorHandler(response)
  }
  const data = await response.json()

  return data
}
