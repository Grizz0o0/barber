import { Router } from 'express'
import PaymentController from '~/controllers/payment.controllers'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import { asyncHandler } from '~/helpers/asyncHandler'
import { UserRole } from '~/constants/user'
import { paymentMoMoSchema, updatePaymentStatusSchema, getPaymentSchema } from '~/requestSchemas/payment.request'

const paymentRouter = Router()

// Public IPN (Called by MoMo)
// Might need distinct logic to verify request signature in Middleware, but for now open
// IMPORTANT: MoMo IPN does not send Authorization header with Bearer token.
paymentRouter.post('/momo-ipn', asyncHandler(PaymentController.momoIpn))

// Protected routes
paymentRouter.use(authentication)

// Create MoMo Payment (Init)
paymentRouter.post('/momo', validateRequest(paymentMoMoSchema), asyncHandler(PaymentController.createMoMoPayment))

// List
paymentRouter.get('/', validateRequest(getPaymentSchema), asyncHandler(PaymentController.getListPayments))

// Detail
paymentRouter.get('/transaction/:id', asyncHandler(PaymentController.getPaymentByTransactionId))
paymentRouter.get('/:id', asyncHandler(PaymentController.getPaymentById))

// Update Status (Admin Only) - Manual correction
paymentRouter.patch(
  '/:id/status',
  authorizeRoles(UserRole.Admin),
  validateRequest(updatePaymentStatusSchema),
  asyncHandler(PaymentController.updatePaymentStatus)
)

export default paymentRouter
