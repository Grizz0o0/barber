import { Router } from 'express'
import statisticsController from '~/controllers/statistics.controllers'
import { asyncHandler } from '~/helpers/asyncHandler'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { UserRole } from '~/constants/user'

const router = Router()

router.use(authentication)
router.use(authorizeRoles(UserRole.Admin))

router.get('/', asyncHandler(statisticsController.getDashboardStats))

export default router
