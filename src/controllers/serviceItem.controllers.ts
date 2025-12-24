import { Request, Response } from 'express'
import ServiceItemService from '~/services/serviceItem.services'
import { SuccessResponse, Created } from '~/responses/success.response'

class ServiceItemController {
  static createServiceItem = async (req: Request, res: Response) => {
    new Created({
      message: 'Create service success',
      metadata: await ServiceItemService.createServiceItem(req.body)
    }).send(res)
  }

  static getAllServiceItems = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get list services success',
      metadata: await ServiceItemService.getAllServiceItems(req.query)
    }).send(res)
  }

  static getServiceItemById = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get service detail success',
      metadata: await ServiceItemService.getServiceItemById(req.params.id)
    }).send(res)
  }

  static updateServiceItem = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Update service success',
      metadata: await ServiceItemService.updateServiceItem(req.params.id, req.body)
    }).send(res)
  }

  static deleteServiceItem = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Delete service success',
      metadata: await ServiceItemService.deleteServiceItem(req.params.id)
    }).send(res)
  }
}

export default ServiceItemController
