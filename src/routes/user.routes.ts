import { Router } from 'express'
import UsersController from '~/controllers/users.controllers'
import { authentication } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import {
  deleteUserSchema,
  getListUserSchema,
  getUserByIdSchema,
  updateMeSchema,
  updateUserSchema
} from '~/requestSchemas/users.request'
import { asyncHandler } from '~/helpers/asyncHandler'
import { authorizeRoles } from '~/middlewares/auth.middlewares'
import { UserRole } from '~/constants/user'

const usersRouter = Router()

usersRouter.get('/barbers', asyncHandler(UsersController.getBarbers))

usersRouter.use(authentication)

usersRouter.get(
  '/',
  authorizeRoles(UserRole.Admin),
  validateRequest(getListUserSchema),
  asyncHandler(UsersController.getAllUsers)
)

usersRouter.post('/', authorizeRoles(UserRole.Admin), asyncHandler(UsersController.createUser))
usersRouter.get('/me', asyncHandler(UsersController.getMe))
usersRouter.patch('/me', validateRequest(updateMeSchema), asyncHandler(UsersController.updateMe))
usersRouter.patch(
  '/:id',
  authorizeRoles(UserRole.Admin),
  validateRequest(updateUserSchema),
  asyncHandler(UsersController.updateUser)
)
usersRouter.delete(
  '/:id',
  authorizeRoles(UserRole.Admin),
  validateRequest(deleteUserSchema),
  asyncHandler(UsersController.deleteUser)
)
usersRouter.get('/:id', validateRequest(getUserByIdSchema), asyncHandler(UsersController.getUserById))

export default usersRouter
