import { Router } from 'express'
import NotificationController from '~/controllers/notification.controllers'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import { asyncHandler } from '~/helpers/asyncHandler'
import { UserRole } from '~/constants/user'
import { createNotificationSchema, getNotificationSchema } from '~/requestSchemas/notification.request'

const notificationRouter = Router()

notificationRouter.use(authentication)

// Get my notifications
notificationRouter.get(
  '/',
  validateRequest(getNotificationSchema),
  asyncHandler(NotificationController.getNotifications)
)

// Mark Read
notificationRouter.patch('/read-all', asyncHandler(NotificationController.markAllAsRead))
notificationRouter.patch('/:id/read', asyncHandler(NotificationController.markAsRead))

// Delete
notificationRouter.delete('/:id', asyncHandler(NotificationController.deleteNotification))

// Admin create manual notification
notificationRouter.post(
  '/',
  authorizeRoles(UserRole.Admin),
  validateRequest(createNotificationSchema),
  asyncHandler(NotificationController.createNotification)
)

export default notificationRouter
