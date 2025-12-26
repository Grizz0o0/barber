import { Router } from 'express'
import OrderController from '~/controllers/order.controllers'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import { asyncHandler } from '~/helpers/asyncHandler'
import { UserRole } from '~/constants/user'
import { createOrderSchema, deleteOrderSchema, getOrderSchema, updateOrderSchema } from '~/requestSchemas/order.request'

const orderRouter = Router()

orderRouter.use(authentication)

// Create
orderRouter.post('/', validateRequest(createOrderSchema), asyncHandler(OrderController.createOrder))

// List
orderRouter.get('/', validateRequest(getOrderSchema), asyncHandler(OrderController.getAllOrders))

// Detail
orderRouter.get('/:id', asyncHandler(OrderController.getOrderById))

// Update (e.g. Cancel or Update Status)
orderRouter.patch(
  '/:id',
  // authorizeRoles(UserRole.Admin, UserRole.Barber), // User might cancel?
  // Let's allow Auth user for now, Service/Controller should ideally check ownership if User/Customer.
  validateRequest(updateOrderSchema),
  asyncHandler(OrderController.updateOrder)
)

// Delete
orderRouter.delete(
  '/:id',
  authorizeRoles(UserRole.Admin),
  validateRequest(deleteOrderSchema),
  asyncHandler(OrderController.deleteOrder)
)

export default orderRouter
