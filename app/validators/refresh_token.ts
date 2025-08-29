import vine from '@vinejs/vine'

export const refreshTokenValidator = vine.compile(
  vine.object({
    refreshToken: vine.string(),
  })
)
