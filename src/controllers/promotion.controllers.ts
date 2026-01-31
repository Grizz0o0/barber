import { Request, Response } from 'express'
import PromotionService from '~/services/promotion.services'
import { SuccessResponse, Created } from '~/responses/success.response'

class PromotionController {
  static createPromotion = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new Created({
      message: 'Create promotion success',
      metadata: await PromotionService.createPromotion(userId, req.body)
    }).send(res)
  }

  static getAllPromotions = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get list promotions success',
      metadata: await PromotionService.getAllPromotions(req.query)
    }).send(res)
  }

  static getPromotionById = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get promotion detail success',
      metadata: await PromotionService.getPromotionById(req.params.id)
    }).send(res)
  }

  static updatePromotion = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Update promotion success',
      metadata: await PromotionService.updatePromotion(userId, req.params.id, req.body)
    }).send(res)
  }

  static deletePromotion = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Delete promotion success',
      metadata: await PromotionService.deletePromotion(userId, req.params.id)
    }).send(res)
  }

  static verifyPromotion = async (req: Request, res: Response) => {
    const { code, amount, context } = req.body
    const result = await PromotionService.verifyPromotion(code, amount, context)
    new SuccessResponse({
      message: result.message || (result.isValid ? 'Mã khuyến mãi hợp lệ' : 'Mã khuyến mãi không hợp lệ'),
      metadata: result
    }).send(res)
  }
}

export default PromotionController
