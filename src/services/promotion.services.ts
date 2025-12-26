import PromotionModel from '~/models/promotion.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { createPagination } from '~/responses/success.response'
import { CreatePromotionReqBody, UpdatePromotionReqBody, GetPromotionQuery } from '~/requestSchemas/promotion.request'
import SocketService from '~/services/socket.services'
import { ObjectId } from 'mongodb'

interface VerifyPromotionResult {
  isValid: boolean
  discountAmount: number
  message?: string
}

class PromotionService {
  static createPromotion = async (userId: string | ObjectId, payload: CreatePromotionReqBody) => {
    const { code, expiryDate } = payload

    // duplicate check
    const existing = await PromotionModel.findOne({ code, isDeleted: false })
    if (existing) {
      throw new BadRequestError('Mã khuyến mãi đã tồn tại')
    }

    const newPromotion = await PromotionModel.create({
      ...payload,
      expiryDate: new Date(expiryDate),
      createdBy: userId,
      updatedBy: userId
    })

    if (!newPromotion) throw new BadRequestError('Create promotion failed')

    SocketService.getInstance().emit('promotion:created', newPromotion)

    return newPromotion
  }

  static getAllPromotions = async ({ limit = 10, page = 1, code, isActive, applicableTo }: GetPromotionQuery) => {
    const skip = ((page || 1) - 1) * (limit || 10)
    const filter: any = { isDeleted: false }

    if (code) filter.code = { $regex: code, $options: 'i' }
    if (isActive) filter.isActive = isActive === 'true'
    if (applicableTo) filter.applicableTo = applicableTo

    const totalItems = await PromotionModel.countDocuments(filter)
    const promotions = await PromotionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit || 10)
      .lean()

    return {
      promotions,
      pagination: createPagination(page || 1, limit || 10, totalItems)
    }
  }

  static getPromotionById = async (id: string) => {
    const promotion = await PromotionModel.findOne({ _id: id, isDeleted: false })
    if (!promotion) throw new NotFoundError('Promotion not found')
    return promotion
  }

  static updatePromotion = async (userId: string | ObjectId, id: string, payload: UpdatePromotionReqBody) => {
    const promotion = await PromotionModel.findOne({ _id: id, isDeleted: false })
    if (!promotion) throw new NotFoundError('Promotion not found')

    if (payload.code && payload.code !== promotion.code) {
      const existing = await PromotionModel.findOne({ code: payload.code, isDeleted: false })
      if (existing) throw new BadRequestError('Mã khuyến mãi đã tồn tại')
    }

    const updatedPromotion = await PromotionModel.findByIdAndUpdate(
      id,
      {
        ...payload,
        ...(payload.expiryDate && { expiryDate: new Date(payload.expiryDate) }),
        updatedBy: userId
      },
      { new: true }
    )

    if (!updatedPromotion) throw new BadRequestError('Update promotion failed')

    SocketService.getInstance().emit('promotion:updated', updatedPromotion)

    return updatedPromotion
  }

  static deletePromotion = async (userId: string | ObjectId, id: string) => {
    const promotion = await PromotionModel.findOne({ _id: id, isDeleted: false })
    if (!promotion) throw new NotFoundError('Promotion not found')

    const deletedPromotion = await PromotionModel.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
      { new: true }
    )

    if (!deletedPromotion) throw new BadRequestError('Delete promotion failed')

    SocketService.getInstance().emit('promotion:deleted', deletedPromotion)

    return deletedPromotion
  }

  static verifyPromotion = async (codeOrId: string, orderTotal: number): Promise<VerifyPromotionResult> => {
    // Determine if input is code or ID
    const filter = ObjectId.isValid(codeOrId) ? { _id: codeOrId } : { code: codeOrId }

    const promotion = await PromotionModel.findOne({ ...filter, isDeleted: false, isActive: true })

    if (!promotion) {
      return { isValid: false, discountAmount: 0, message: 'Khuyến mãi không tồn tại hoặc đã bị khóa' }
    }

    if (promotion.expiryDate < new Date()) {
      return { isValid: false, discountAmount: 0, message: 'Mã khuyến mãi đã hết hạn' }
    }

    if (promotion.maxUsage && promotion.usedCount >= promotion.maxUsage) {
      return { isValid: false, discountAmount: 0, message: 'Mã khuyến mãi đã hết lượt sử dụng' }
    }

    if (orderTotal < promotion.minOrderValue) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Đơn hàng chưa đủ điều kiện tối thiểu ${promotion.minOrderValue}`
      }
    }

    // Calculate discount
    let discountAmount = 0
    if (promotion.discountPercent) {
      discountAmount = (orderTotal * promotion.discountPercent) / 100
    }

    // Ensure discount doesn't exceed total
    if (discountAmount > orderTotal) discountAmount = orderTotal

    return { isValid: true, discountAmount }
  }

  static incrementUsage = async (promotionId: string | ObjectId) => {
    return await PromotionModel.findByIdAndUpdate(promotionId, { $inc: { usedCount: 1 } })
  }
}

export default PromotionService
