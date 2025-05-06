import { test } from '@japa/runner'

test('API v1 root endpoint returns correct information', async ({ client }) => {
  const response = await client.get('/api/v1')

  response.assertStatus(200)
  response.assertBodyContains({
    name: 'warden',
    description: 'Authentication microservice for the Sleeved ecosystem',
  })
})
