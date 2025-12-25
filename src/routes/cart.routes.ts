import { Router } from 'express'
import CartController from '~/controllers/cart.controllers'
import { authentication } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import { asyncHandler } from '~/helpers/asyncHandler'
import { addToCartSchema, removeCartItemSchema, updateCartItemSchema } from '~/requestSchemas/cart.request'

const cartRouter = Router()

// Protected routes (Login needed)
cartRouter.use(authentication)

// Get Cart
cartRouter.get('/', asyncHandler(CartController.getCart))

// Add to Cart
cartRouter.post('/add-to-cart', validateRequest(addToCartSchema), asyncHandler(CartController.addToCart))

// Update Quantity
cartRouter.patch(
  '/update-quantity',
  validateRequest(updateCartItemSchema),
  asyncHandler(CartController.updateItemQuantity)
)

// Remove Item
cartRouter.delete(
  '/remove-item/:productId',
  validateRequest(removeCartItemSchema),
  asyncHandler(CartController.removeItem)
)

// Clear Cart
cartRouter.delete('/clear', asyncHandler(CartController.clearCart))

export default cartRouter
