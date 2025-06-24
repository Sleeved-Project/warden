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

  /**
   * Exchange mobile Google auth token/code for a user session
   */
  async exchangeToken({ request, response, params, logger }: HttpContext) {
    const provider = params.provider
    const { idToken, code, codeVerifier } = request.only(['idToken', 'code', 'codeVerifier'])

    console.log('Token exchange request received', {
      provider,
      hasIdToken: !!idToken,
      hasCode: !!code,
      hasCodeVerifier: !!codeVerifier,
    })

    // Si ni idToken ni code n'est fourni
    if (!idToken && !code) {
      return response.badRequest({ error: 'ID token or authorization code is required' })
    }

    if (!['google'].includes(provider)) {
      return response.badRequest({ error: 'Provider not supported' })
    }

    try {
      let socialUser

      // Cas 1: On a un ID token
      if (idToken) {
        const googleUserInfo = await this.verifyGoogleIdToken(idToken)
        if (!googleUserInfo) {
          return response.unauthorized({ error: 'Invalid ID token' })
        }

        socialUser = {
          id: googleUserInfo.sub,
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          emailVerificationState: googleUserInfo.email_verified ? 'verified' : 'unverified',
          avatarUrl: googleUserInfo.picture,
        }
      }
      // Cas 2: On a un code d'autorisation
      else if (code) {
        const tokens = await this.exchangeAuthorizationCode(code, codeVerifier)
        if (!tokens || !tokens.id_token) {
          return response.unauthorized({ error: 'Invalid authorization code' })
        }

        // Vérifier le ID token obtenu
        const googleUserInfo = await this.verifyGoogleIdToken(tokens.id_token)
        if (!googleUserInfo) {
          return response.unauthorized({ error: 'Invalid token obtained from authorization code' })
        }

        socialUser = {
          id: googleUserInfo.sub,
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          emailVerificationState: googleUserInfo.email_verified ? 'verified' : 'unverified',
          avatarUrl: googleUserInfo.picture,
        }
      }

      // Authentifier l'utilisateur
      const authResult = await this.socialAuthService.authenticate(provider, socialUser)

      return response.ok({
        user: authResult.user,
        token: authResult.token,
        type: 'bearer',
        isNewUser: authResult.isNewUser,
      })
    } catch (error) {
      console.error('Error during token exchange:', error)
      return response.internalServerError({
        error: 'Authentication failed',
        details: error.message,
      })
    }
  }

  /**
   * Verify a Google ID token and return user info
   */
  private async verifyGoogleIdToken(idToken: string) {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)

      if (!response.ok) {
        console.error('Failed to verify Google ID token', { status: response.status })
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error verifying Google ID token', { error })
      return null
    }
  }

  /**
   * Échange un code d'autorisation contre des tokens OAuth
   */
  private async exchangeAuthorizationCode(code: string, codeVerifier?: string) {
    try {
      const env = process.env

      // Déterminer si c'est un flux mobile (avec codeVerifier)
      const isMobileFlow = !!codeVerifier

      // Définir les variables AVANT de les utiliser
      const CLIENT_ID = isMobileFlow ? env.GOOGLE_IOS_CLIENT_ID : env.GOOGLE_CLIENT_ID
      const REDIRECT_URI = isMobileFlow
        ? env.GOOGLE_IOS_REDIRECT_URI
        : 'http://localhost:8081/api/v1/google/callback'

      // Créer les paramètres
      const params: Record<string, string> = {
        code,
        client_id: CLIENT_ID!,
        redirect_uri: REDIRECT_URI!,
        grant_type: 'authorization_code',
      }

      // Si c'est un flux mobile, ne pas utiliser le client secret
      if (!isMobileFlow) {
        params.client_secret = env.GOOGLE_CLIENT_SECRET!
      }

      if (codeVerifier) {
        params.code_verifier = codeVerifier
      }

      // Logger APRÈS avoir défini toutes les variables
      console.log('Google token exchange request', {
        isMobileFlow,
        clientId: CLIENT_ID?.substring(0, 8) + '...',
        redirectUri: REDIRECT_URI,
        hasCodeVerifier: !!codeVerifier,
        paramsKeys: Object.keys(params),
      })

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Google token exchange error:', errorData)
        return null
      }

      const tokenData = await response.json()
      console.log('Successfully exchanged code for tokens', {
        hasIdToken: !!tokenData.id_token,
        hasAccessToken: !!tokenData.access_token,
        expiresIn: tokenData.expires_in,
      })

      return tokenData
    } catch (error) {
      console.error('Failed to exchange authorization code:', error)
      return null
    }
  }
}
