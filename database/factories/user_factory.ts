import { v4 as uuidv4 } from 'uuid'
import factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import { UserRole } from '#types/auth'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      id: uuidv4(),
      email: faker.internet.email().toLowerCase(),
      password: 'password123',
      fullName: faker.person.fullName(),
      role: UserRole.USER,
    }
  })
  .build()
