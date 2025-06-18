import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SocialAuthService from '#services/social_auth_service'

@inject()
export default class SocialAuthController {
  constructor(protected socialAuthService: SocialAuthService) {}

  /**
   * Redirect user to the OAuth provider
   */
  async redirect({ ally, params, response }: HttpContext) {
    if (!['google'].includes(params.provider)) {
      return response.status(400).json({ error: 'Provider not supported' })
    }

    return ally.use(params.provider).redirect()
  }

  /**
   * Handle the callback from OAuth provider
   */
  async callback({ ally, params, response, logger }: HttpContext) {
    const provider = params.provider

    if (!['google'].includes(provider)) {
      return response.status(400).json({ error: 'Provider not supported' })
    }

    const socialDriver = ally.use(provider)

    // Vérifier les erreurs OAuth
    if (socialDriver.accessDenied()) {
      return response.status(401).json({ error: 'Access denied' })
    }

    if (socialDriver.stateMisMatch()) {
      return response.status(401).json({ error: 'State mismatch' })
    }

    if (socialDriver.hasError()) {
      return response.status(401).json({ error: socialDriver.getError() })
    }

    try {
      // Obtenir les informations utilisateur du fournisseur OAuth
      const socialUser = await socialDriver.user()

      // Déléguer l'authentification au service
      const authResult = await this.socialAuthService.authenticate(provider, socialUser)

      // Retourner la réponse formatée
      return response.json({
        user: authResult.user,
        token: authResult.token,
        type: 'bearer',
        isNewUser: authResult.isNewUser,
      })
    } catch (error) {
      logger.error(error, 'Error during social authentication')

      if (error.message === 'Email not verified with provider') {
        return response.status(401).json({
          error: 'Your email must be verified with your provider to login',
        })
      }

      return response.status(500).json({ error: 'Authentication failed' })
    }
  }
}
