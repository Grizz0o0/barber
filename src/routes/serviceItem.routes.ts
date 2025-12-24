import { Router } from 'express'
import ServiceItemController from '~/controllers/serviceItem.controllers'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import { asyncHandler } from '~/helpers/asyncHandler'
import { UserRole } from '~/constants/user'
import {
  createServiceItemSchema,
  deleteServiceItemSchema,
  getListServiceItemSchema,
  getServiceItemByIdSchema,
  updateServiceItemSchema
} from '~/requestSchemas/serviceItem.request'

const serviceItemRouter = Router()

// Public routes
serviceItemRouter.get(
  '/',
  validateRequest(getListServiceItemSchema),
  asyncHandler(ServiceItemController.getAllServiceItems)
)

serviceItemRouter.get(
  '/:id',
  validateRequest(getServiceItemByIdSchema),
  asyncHandler(ServiceItemController.getServiceItemById)
)

// Protected routes (Admin only)
serviceItemRouter.use(authentication)
serviceItemRouter.use(authorizeRoles(UserRole.Admin)) // Apply admin check for creating/updating/deleting

serviceItemRouter.post(
  '/',
  validateRequest(createServiceItemSchema),
  asyncHandler(ServiceItemController.createServiceItem)
)

serviceItemRouter.patch(
  '/:id',
  validateRequest(updateServiceItemSchema),
  asyncHandler(ServiceItemController.updateServiceItem)
)

serviceItemRouter.delete(
  '/:id',
  validateRequest(deleteServiceItemSchema),
  asyncHandler(ServiceItemController.deleteServiceItem)
)

export default serviceItemRouter
