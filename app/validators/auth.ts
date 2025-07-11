import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
    password: vine
      .string()
      .minLength(8)
      .maxLength(64)
      .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/),
    fullName: vine.string().trim().optional(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
    password: vine.string(),
  })
)

export const verifyEmailValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
    code: vine.string().minLength(6).maxLength(6),
  })
)

export const resendVerificationValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
  })
)
