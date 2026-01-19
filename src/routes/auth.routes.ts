import { Router } from 'express'
import AuthController from '~/controllers/auth.controllers'
import { authentication, authenticationV2 } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import {
  authenticationSchema,
  authenticationV2Schema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendForgotPasswordSchema,
  resendVerifyEmailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyForgotPasswordSchema
} from '~/requestSchemas/auth.request'
import { asyncHandler } from '~/helpers/asyncHandler'

import { authLimiter } from '~/middlewares/rateLimit.middleware'

const authRouter = Router()

authRouter.post('/register', authLimiter, validateRequest(registerSchema), asyncHandler(AuthController.register))
authRouter.post('/login', authLimiter, validateRequest(loginSchema), asyncHandler(AuthController.login))

authRouter.post(
  '/logout',
  validateRequest({ headers: authenticationV2Schema }),
  authenticationV2,
  asyncHandler(AuthController.logout)
)
// authRouter.post('/verify-email', validateRequest(verifyEmailSchema), asyncHandler(AuthController.verifyEmail))
// authRouter.post(
//   '/resend-verify-email',
//   validateRequest(resendVerifyEmailSchema),
//   asyncHandler(AuthController.resendVerifyEmail)
// )
authRouter.post('/forgot-password', validateRequest(forgotPasswordSchema), asyncHandler(AuthController.forgotPassword))
authRouter.post(
  '/verify-forgot-password',
  validateRequest(verifyForgotPasswordSchema),
  asyncHandler(AuthController.verifyForgotPassword)
)
authRouter.post('/reset-password', validateRequest(resetPasswordSchema), asyncHandler(AuthController.resetPassword))

authRouter.post(
  '/change-password',
  validateRequest({ headers: authenticationSchema }),
  authentication,
  validateRequest(changePasswordSchema),
  asyncHandler(AuthController.changePassword)
)

authRouter.post(
  '/refresh-token',
  validateRequest({ headers: authenticationV2Schema }),
  authenticationV2,
  asyncHandler(AuthController.refreshToken)
)
authRouter.get('/google/callback', asyncHandler(AuthController.oAuthGoogle))

export default authRouter
