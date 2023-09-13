import { errorHandler } from '../utils'

export const serverConfig = async () => {
  const response = await fetch(`/api/config`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    console.error('[serverConfig]: Error happened while fetching data')
    //console.error(response)
    return await errorHandler(response)
  }
  const data = await response.json()
  return data
}
