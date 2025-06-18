import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import type { AllyUserContract } from '@adonisjs/ally/types'
import User from '#models/user'
import TokenService from '#services/token_service'

interface SocialAuthResult {
  user: {
    id: string
    email: string
    fullName: string | null
    isVerified: boolean
    avatarUrl: string | null
  }
  token: string
  isNewUser: boolean
}

@inject()
export default class SocialAuthService {
  constructor(
    private tokenService: TokenService,
    private logger: Logger
  ) {}

  /**
   * Authenticate a user via social login
   */
  async authenticate(provider: string, socialUser: AllyUserContract): Promise<SocialAuthResult> {
    // Valider que l'email est vérifié
    if (socialUser.emailVerificationState !== 'verified') {
      throw new Error('Email not verified with provider')
    }

    // Rechercher l'utilisateur par provider ID
    let user = await User.query()
      .where('provider', provider)
      .where('provider_id', socialUser.id)
      .first()

    // Si non trouvé par provider ID, rechercher par email
    let isNewUser = false
    if (!user && socialUser.email) {
      user = await User.findBy('email', socialUser.email)
    }

    // Créer un nouvel utilisateur si nécessaire
    if (!user) {
      user = await this.createSocialUser(provider, socialUser)
      isNewUser = true
      this.logger.info(`Created new user via social auth: ${user.id}`)
    }
    // Mettre à jour l'utilisateur existant avec les informations sociales si trouvé par email mais pas encore lié
    else if (!user.provider) {
      await this.linkSocialAccount(user, provider, socialUser)
      this.logger.info(`Linked existing user to social account: ${user.id}`)
    }

    // Générer un token d'authentification
    const token = await this.tokenService.generateAuthToken(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
      token,
      isNewUser,
    }
  }

  /**
   * Create a new user from social profile
   */
  private async createSocialUser(provider: string, socialUser: AllyUserContract): Promise<User> {
    return User.create({
      email: socialUser.email || `${provider}_${socialUser.id}@example.com`,
      fullName: socialUser.name,
      provider,
      providerId: socialUser.id,
      avatarUrl: socialUser.avatarUrl,
      password: null, // Pas de mot de passe pour les utilisateurs d'auth sociale
      isVerified: true, // Les utilisateurs sociaux sont pré-vérifiés
    })
  }

  /**
   * Link social account to existing user
   */
  private async linkSocialAccount(
    user: User,
    provider: string,
    socialUser: AllyUserContract
  ): Promise<void> {
    user.provider = provider
    user.providerId = socialUser.id
    user.avatarUrl = socialUser.avatarUrl || user.avatarUrl
    user.isVerified = true // Marquer comme vérifié
    await user.save()
  }
}
