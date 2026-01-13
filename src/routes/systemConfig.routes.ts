import { Router } from 'express'
import SystemConfigsController from '~/controllers/systemConfigs.controllers'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { asyncHandler } from '~/helpers/asyncHandler'
import { UserRole } from '~/constants/user'

const systemConfigRouter = Router()

// Public routes
systemConfigRouter.get('/', asyncHandler(SystemConfigsController.getConfig))

// Protected routes (Admin only)
systemConfigRouter.use(authentication)
systemConfigRouter.use(authorizeRoles(UserRole.Admin))

systemConfigRouter.patch('/', asyncHandler(SystemConfigsController.updateConfig))

export default systemConfigRouter
