import { Request, Response } from 'express'
import OrderService from '~/services/order.services'
import { SuccessResponse, Created } from '~/responses/success.response'

class OrderController {
  static createOrder = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new Created({
      message: 'Create order success',
      metadata: await OrderService.createOrder(userId, req.body)
    }).send(res)
  }

  static getAllOrders = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get list orders success',
      metadata: await OrderService.getAllOrders(req.query, req.user!.userId.toString(), req.user!.role)
    }).send(res)
  }

  static getOrderById = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get order detail success',
      metadata: await OrderService.getOrderById(req.params.id, req.user!.userId.toString(), req.user!.role)
    }).send(res)
  }

  static updateOrder = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Update order success',
      metadata: await OrderService.updateOrder(req.params.id, req.body, req.user!.userId.toString(), req.user!.role)
    }).send(res)
  }

  static deleteOrder = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Delete order success',
      metadata: await OrderService.deleteOrder(req.params.id)
    }).send(res)
  }
}

export default OrderController
