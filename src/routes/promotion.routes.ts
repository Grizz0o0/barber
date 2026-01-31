import { Router } from 'express'
import PromotionController from '~/controllers/promotion.controllers'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import { asyncHandler } from '~/helpers/asyncHandler'
import { UserRole } from '~/constants/user'
import {
  createPromotionSchema,
  deletePromotionSchema,
  getPromotionSchema,
  updatePromotionSchema,
  verifyPromotionSchema
} from '~/requestSchemas/promotion.request'

const promotionRouter = Router()

promotionRouter.use(authentication)

// Create (Admin only)
promotionRouter.post(
  '/',
  authorizeRoles(UserRole.Admin),
  validateRequest(createPromotionSchema),
  asyncHandler(PromotionController.createPromotion)
)

// Verify Promotion
promotionRouter.post(
  '/verify',
  validateRequest(verifyPromotionSchema),
  asyncHandler(PromotionController.verifyPromotion)
)

// List (Authenticated users)
promotionRouter.get('/', validateRequest(getPromotionSchema), asyncHandler(PromotionController.getAllPromotions))

// Detail
promotionRouter.get('/:id', asyncHandler(PromotionController.getPromotionById))

// Update (Admin only)
promotionRouter.patch(
  '/:id',
  authorizeRoles(UserRole.Admin),
  validateRequest(updatePromotionSchema),
  asyncHandler(PromotionController.updatePromotion)
)

// Delete (Admin only)
promotionRouter.delete(
  '/:id',
  authorizeRoles(UserRole.Admin),
  validateRequest(deletePromotionSchema),
  asyncHandler(PromotionController.deletePromotion)
)

export default promotionRouter
