import { Router } from 'express'
import ReviewController from '~/controllers/review.controllers'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import { asyncHandler } from '~/helpers/asyncHandler'
import { UserRole } from '~/constants/user'
import {
  createReviewSchema,
  updateReviewSchema,
  replyReviewSchema,
  getReviewSchema
} from '~/requestSchemas/review.request'

const reviewRouter = Router()

// Public
reviewRouter.get('/', validateRequest(getReviewSchema), asyncHandler(ReviewController.getReviews))

// Protected
reviewRouter.use(authentication)

reviewRouter.post('/', validateRequest(createReviewSchema), asyncHandler(ReviewController.createReview))
reviewRouter.get('/likes', asyncHandler(ReviewController.getLikedReviews))
reviewRouter.patch('/:id', validateRequest(updateReviewSchema), asyncHandler(ReviewController.updateReview))
reviewRouter.post('/:id/like', asyncHandler(ReviewController.likeReview))
reviewRouter.delete('/:id', asyncHandler(ReviewController.deleteReview))

// Admin/Barber logic
// Reply to review
reviewRouter.post(
  '/:id/reply',
  authorizeRoles(UserRole.Admin, UserRole.Barber),
  validateRequest(replyReviewSchema),
  asyncHandler(ReviewController.replyReview)
)

export default reviewRouter
