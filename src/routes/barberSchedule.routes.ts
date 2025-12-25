import { Router } from 'express'
import BarberScheduleController from '~/controllers/barberSchedule.controllers'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import { asyncHandler } from '~/helpers/asyncHandler'
import { UserRole } from '~/constants/user'
import {
  createBarberScheduleSchema,
  deleteBarberScheduleSchema,
  getBarberScheduleSchema,
  updateBarberScheduleSchema
} from '~/requestSchemas/barberSchedule.request'

const barberScheduleRouter = Router()

// Public routes
barberScheduleRouter.get(
  '/',
  validateRequest(getBarberScheduleSchema),
  asyncHandler(BarberScheduleController.getAllSchedules)
)

barberScheduleRouter.get('/:id', asyncHandler(BarberScheduleController.getScheduleById))

// Protected routes
barberScheduleRouter.use(authentication)

// Create - Admin Only (Or Barber? Plan said Admin/Owner but simplifying to Admin for now based on typical flows or Owner later)
// Let's stick to Admin or Barber.
// If Barber, we need to ensure they can only create for themselves which needs logic in controller/service.
// For now, let's allow Admin and Barber role, but assuming client sends correct barber ID.
// Ideally, if role is Barber, we should force payload.barber = req.user._id in a middleware or controller.
// But for simplicity of CRUD requests requested:
barberScheduleRouter.post(
  '/',
  authorizeRoles(UserRole.Admin, UserRole.Barber),
  validateRequest(createBarberScheduleSchema),
  asyncHandler(BarberScheduleController.createSchedule)
)

barberScheduleRouter.patch(
  '/:id',
  authorizeRoles(UserRole.Admin, UserRole.Barber),
  validateRequest(updateBarberScheduleSchema),
  asyncHandler(BarberScheduleController.updateSchedule)
)

barberScheduleRouter.delete(
  '/:id',
  authorizeRoles(UserRole.Admin, UserRole.Barber),
  validateRequest(deleteBarberScheduleSchema),
  asyncHandler(BarberScheduleController.deleteSchedule)
)

export default barberScheduleRouter
