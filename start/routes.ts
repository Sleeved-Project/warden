import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const HealthCheckController = () => import('#controllers/health_check_controller')
const RootController = () => import('#controllers/root_controller')
const DocsController = () => import('#controllers/docs_controller')
const ApiInfoController = () => import('#controllers/api_info_controller')
const AuthController = () => import('#controllers/auth_controller')
const EmailVerificationController = () => import('#controllers/email_verification_controller')

router.get('/', [RootController, 'handle'])
router.get('/health', [HealthCheckController, 'handle'])
router.get('/docs/json', [DocsController, 'swaggerJson'])
router.get('/docs', [DocsController, 'swaggerUi'])

router
  .group(() => {
    router
      .group(() => {
        router.get('/', [ApiInfoController, 'handle'])

        router.post('/register', [AuthController, 'register'])
        router.post('/login', [AuthController, 'login'])
        router.get('/me', [AuthController, 'me']).use(middleware.auth())

        router.post('/verify-email', [EmailVerificationController, 'verify'])
        router.post('/resend-verification', [EmailVerificationController, 'resend'])
      })
      .prefix('/v1')
  })
  .prefix('/api')
