import { Request, Response, NextFunction } from 'express'
import SystemConfigsService from '~/services/systemConfigs.services'
import { OK } from '~/responses/success.response'

class SystemConfigsController {
  getConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await SystemConfigsService.getConfig()
      new OK({
        message: 'Get system config success',
        metadata: config
      }).send(res)
    } catch (error) {
      next(error)
    }
  }

  updateConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await SystemConfigsService.updateConfig(req.body)
      new OK({
        message: 'Update system config success',
        metadata: config
      }).send(res)
    } catch (error) {
      next(error)
    }
  }
}

export default new SystemConfigsController()
