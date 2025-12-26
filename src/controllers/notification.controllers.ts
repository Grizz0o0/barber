import { Request, Response } from 'express'
import NotificationService from '~/services/notification.services'
import { Created, SuccessResponse } from '~/responses/success.response'

class NotificationController {
  // Admin only
  static createNotification = async (req: Request, res: Response) => {
    new Created({
      message: 'Create notification success',
      metadata: await NotificationService.createNotification(req.body)
    }).send(res)
  }

  static getNotifications = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Get notifications success',
      metadata: await NotificationService.getNotifications(userId, req.query)
    }).send(res)
  }

  static markAsRead = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Mark as read success',
      metadata: await NotificationService.markAsRead(userId, req.params.id)
    }).send(res)
  }

  static markAllAsRead = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Mark all as read success',
      metadata: await NotificationService.markAllAsRead(userId)
    }).send(res)
  }

  static deleteNotification = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Delete notification success',
      metadata: await NotificationService.deleteNotification(userId, req.params.id)
    }).send(res)
  }
}

export default NotificationController
