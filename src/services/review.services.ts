import ReviewModel from '~/models/review.model'
import BookingModel from '~/models/booking.model'
import ProductModel from '~/models/product.model'
import OrderModel from '~/models/order.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { createPagination } from '~/responses/success.response'
import {
  CreateReviewReqBody,
  UpdateReviewReqBody,
  GetReviewQuery,
  ReplyReviewReqBody
} from '~/requestSchemas/review.request'
import { ObjectId } from 'mongodb'
import { UserRole } from '~/constants/user'
import UserModel from '~/models/user.model'
import NotificationService from '~/services/notification.services'
import { NotificationType } from '~/models/notification.model'

class ReviewService {
  static createReview = async (userId: string | ObjectId, payload: CreateReviewReqBody) => {
    const { product, booking, rating, comment, images } = payload

    // 1. Validate Target
    if (booking) {
      // Check booking
      const foundBooking = await BookingModel.findOne({ _id: booking, isDeleted: false })
      if (!foundBooking) throw new NotFoundError('Booking not found')

      if (foundBooking.user.toString() !== userId.toString()) {
        throw new BadRequestError('Bạn không có quyền đánh giá lịch đặt này')
      }

      if (foundBooking.status !== 'completed') {
        throw new BadRequestError('Chỉ có thể đánh giá khi dịch vụ đã hoàn thành')
      }
    } else if (product) {
      // Check product purchase
      const orders = await OrderModel.find({
        user: userId,
        status: 'delivered',
        'items.product': product
      })

      // Strict Mode: Enforce purchase
      if (orders.length === 0) {
        throw new BadRequestError('Bạn chưa mua sản phẩm này hoặc đơn hàng chưa giao thành công')
      }

      const foundProduct = await ProductModel.findById(product)
      if (!foundProduct) throw new NotFoundError('Product not found')
    }

    // 2. Create Review
    let newReview
    try {
      const reviewData: any = {
        user: userId,
        ...payload
      }

      if (booking) {
        // We already foundBooking above but TS might complain if scope issue.
        // Re-finding is redundant but let's assume valid.
        const foundBooking = await BookingModel.findById(booking)
        if (foundBooking) {
          reviewData.barber = foundBooking.barber
        }
      }

      newReview = await ReviewModel.create(reviewData)

      // 3. Update Aggregations (Async)
      if (product) {
        ReviewService.calcProductRating(product)
      } else if (reviewData.barber) {
        ReviewService.calcBarberRating(reviewData.barber.toString())
      }

      return newReview
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestError('Bạn đã đánh giá dịch vụ/sản phẩm này rồi')
      }
      throw error
    }
  }

  static calcProductRating = async (productId: string) => {
    const stats = await ReviewModel.aggregate([
      { $match: { product: new ObjectId(productId), isDeleted: false } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ])

    if (stats.length > 0) {
      await ProductModel.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        ratingCount: stats[0].count
      })
    } else {
      await ProductModel.findByIdAndUpdate(productId, { rating: 0, ratingCount: 0 })
    }
  }

  static calcBarberRating = async (barberId: string) => {
    const stats = await ReviewModel.aggregate([
      { $match: { barber: new ObjectId(barberId), isDeleted: false } },
      { $group: { _id: '$barber', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ])

    if (stats.length > 0) {
      // Assuming 'User' Model has rating fields (optional)
      await UserModel.findByIdAndUpdate(barberId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        ratingCount: stats[0].count
      }).catch(console.error)
    } else {
      await UserModel.findByIdAndUpdate(barberId, { rating: 0, ratingCount: 0 }).catch(console.error)
    }
  }

  static getReviews = async ({ limit = 10, page = 1, rating, product, booking, hasReply }: GetReviewQuery) => {
    const skip = ((page || 1) - 1) * (limit || 10)
    const filter: any = { isDeleted: false }

    if (rating) filter.rating = rating
    if (product) filter.product = product
    if (booking) filter.booking = booking
    if (hasReply) {
      filter.reply = hasReply === 'true' ? { $exists: true, $ne: '' } : { $in: [null, ''] }
    }

    const totalItems = await ReviewModel.countDocuments(filter)
    const reviews = await ReviewModel.find(filter)
      .populate('user', 'name avatar')
      .populate('product', 'name image') // Optional
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit || 10)
      .lean()

    return {
      reviews,
      pagination: createPagination(page || 1, limit || 10, totalItems)
    }
  }

  static updateReview = async (userId: string | ObjectId, reviewId: string, payload: UpdateReviewReqBody) => {
    const review = await ReviewModel.findOne({ _id: reviewId, isDeleted: false })
    if (!review) throw new NotFoundError('Review not found')

    if (review.user.toString() !== userId.toString()) {
      throw new BadRequestError('Bạn không có quyền sửa đánh giá này')
    }

    const updated = await ReviewModel.findByIdAndUpdate(reviewId, payload, { new: true })

    if (!updated) throw new NotFoundError('Review not found')

    if (updated.product) {
      ReviewService.calcProductRating(updated.product.toString())
    } else if (updated.barber) {
      ReviewService.calcBarberRating(updated.barber.toString())
    }

    return updated
  }

  static deleteReview = async (userId: string | ObjectId, reviewId: string, role: string) => {
    const review = await ReviewModel.findOne({ _id: reviewId, isDeleted: false })
    if (!review) throw new NotFoundError('Review not found')

    if (role !== UserRole.Admin && review.user.toString() !== userId.toString()) {
      throw new BadRequestError('Bạn không có quyền xóa đánh giá này')
    }

    await ReviewModel.findByIdAndUpdate(reviewId, { isDeleted: true })

    if (review.product) {
      ReviewService.calcProductRating(review.product.toString())
    } else if (review.barber) {
      ReviewService.calcBarberRating(review.barber.toString())
    }

    return { message: 'Deleted successfully' }
  }

  // Admin/Staff only
  static replyReview = async (
    userId: string | ObjectId,
    reviewId: string,
    payload: ReplyReviewReqBody,
    role: string
  ) => {
    const review = await ReviewModel.findOne({ _id: reviewId, isDeleted: false })
    if (!review) throw new NotFoundError('Review not found')

    if (role === UserRole.Barber) {
      if (!review.barber || review.barber.toString() !== userId.toString()) {
        throw new BadRequestError('Bạn chỉ được phép trả lời đánh giá của chính mình')
      }
    }

    review.reply = payload.reply
    await review.save()

    // Notify user about reply
    NotificationService.pushNotification({
      userId: review.user,
      title: 'Phản hồi đánh giá',
      message: 'Admin/Cửa hàng đã phản hồi đánh giá của bạn',
      type: NotificationType.Review,
      referenceId: review._id
    }).catch(console.error)

    return review
  }
}

export default ReviewService
