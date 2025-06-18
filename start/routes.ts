import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const HealthCheckController = () => import('#controllers/health_check_controller')
const RootController = () => import('#controllers/root_controller')
const ApiInfoController = () => import('#controllers/api_info_controller')
const AuthController = () => import('#controllers/auth_controller')
const SocialAuthController = () => import('#controllers/social_auth_controller')
const EmailVerificationController = () => import('#controllers/email_verification_controller')

router.get('/', [RootController, 'handle'])
router.get('/health', [HealthCheckController, 'handle'])

router
  .group(() => {
    router
      .group(() => {
        router.get('/', [ApiInfoController, 'handle'])

        router.post('/register', [AuthController, 'register'])
        router.post('/login', [AuthController, 'login'])
        router.get('/me', [AuthController, 'me']).use(middleware.auth())

        router.get('/:provider/redirect', [SocialAuthController, 'redirect'])
        router.get('/:provider/callback', [SocialAuthController, 'callback'])

        router.post('/verify-email', [EmailVerificationController, 'verify'])
        router.post('/resend-verification', [EmailVerificationController, 'resend'])
      })
      .prefix('/v1')
  })
  .prefix('/api')
