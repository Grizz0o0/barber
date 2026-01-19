import { Request, Response, NextFunction } from 'express'
import { SuccessResponse } from '~/responses/success.response'
import aiService from '~/services/ai.services'

class AIController {
  async consult(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.getConsultation(req.body)
      new SuccessResponse({
        message: 'Get hair consultation successfully',
        metadata: result
      }).send(res)
    } catch (error) {
      next(error)
    }
  }

  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, history } = req.body
      const result = await aiService.chat(message, history)
      new SuccessResponse({
        message: 'Chat response successfully',
        metadata: result
      }).send(res)
    } catch (error) {
      next(error)
    }
  }
}

export default new AIController()
