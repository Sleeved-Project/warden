import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const HealthCheckController = () => import('#controllers/health_check_controller')
const RootController = () => import('#controllers/root_controller')
const ApiInfoController = () => import('#controllers/api_info_controller')
const AuthController = () => import('#controllers/auth_controller')

router.get('/', [RootController, 'handle'])
router.get('/health', [HealthCheckController, 'handle'])

const apiV1 = router.group(() => {
  router.get('/', [ApiInfoController, 'handle'])

  router.post('/register', [AuthController, 'register'])
  router.post('/login', [AuthController, 'login'])
  router.get('/me', [AuthController, 'me']).use(middleware.auth())
})

apiV1.prefix('/api/v1')
