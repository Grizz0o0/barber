import { Request, Response } from 'express'
import ReviewService from '~/services/review.services'
import { Created, SuccessResponse } from '~/responses/success.response'

class ReviewController {
  static createReview = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new Created({
      message: 'Create review success',
      metadata: await ReviewService.createReview(userId, req.body)
    }).send(res)
  }

  static getReviews = async (req: Request, res: Response) => {
    // Public endpoint usually, but maybe used for admin
    new SuccessResponse({
      message: 'Get reviews success',
      metadata: await ReviewService.getReviews(req.query)
    }).send(res)
  }

  static updateReview = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Update review success',
      metadata: await ReviewService.updateReview(userId, req.params.id, req.body)
    }).send(res)
  }

  static deleteReview = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    const { role } = req.user!
    new SuccessResponse({
      message: 'Delete review success',
      metadata: await ReviewService.deleteReview(userId, req.params.id, role)
    }).send(res)
  }

  static replyReview = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    const { role } = req.user!
    new SuccessResponse({
      message: 'Reply review success',
      metadata: await ReviewService.replyReview(userId, req.params.id, req.body, role)
    }).send(res)
  }
}

export default ReviewController
