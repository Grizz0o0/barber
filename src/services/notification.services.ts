import NotificationModel, { NotificationType } from '~/models/notification.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { createPagination } from '~/responses/success.response'
import { CreateNotificationReqBody, GetNotificationQuery } from '~/requestSchemas/notification.request'
import { ObjectId } from 'mongodb'
import SocketService from '~/services/socket.services'

interface CreateNotificationParams {
  userId: string | ObjectId
  title: string
  message: string
  type?: NotificationType
  referenceId?: string | ObjectId
}

class NotificationService {
  /**
   * Core function to create notification and emit socket event.
   * Can be used by other services internally.
   */
  static pushNotification = async ({
    userId,
    title,
    message,
    type = NotificationType.System,
    referenceId
  }: CreateNotificationParams) => {
    const notification = await NotificationModel.create({
      user: userId,
      title,
      message,
      type,
      referenceId
    })

    // Emit Real-time event
    // Client should listen to `notification:userId` or generic `notification` room
    SocketService.getInstance().emit(`notification:${userId}`, notification)

    return notification
  }

  // Admin manually create via API
  static createNotification = async (payload: CreateNotificationReqBody) => {
    // Logic for bulk send or single user
    if (payload.userId) {
      return await this.pushNotification({
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        referenceId: payload.referenceId
      })
    }

    // If no userId provided, maybe broadcast? (Not implemented simple version yet)
    throw new BadRequestError('UserId is required for now')
  }

  static getNotifications = async (
    userId: string | ObjectId,
    { limit = 10, page = 1, type, isRead }: GetNotificationQuery
  ) => {
    const skip = ((page || 1) - 1) * (limit || 10)
    const filter: any = { user: userId, isDeleted: false }

    if (type) filter.type = type
    if (isRead) filter.isRead = isRead === 'true'

    const totalItems = await NotificationModel.countDocuments(filter)
    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit || 10)
      .lean()

    // Count unread
    const unreadCount = await NotificationModel.countDocuments({ user: userId, isRead: false, isDeleted: false })

    return {
      notifications,
      unreadCount,
      pagination: createPagination(page || 1, limit || 10, totalItems)
    }
  }

  static markAsRead = async (userId: string | ObjectId, notificationId: string) => {
    const notification = await NotificationModel.findOne({ _id: notificationId, user: userId })
    if (!notification) throw new NotFoundError('Notification not found')

    notification.isRead = true
    await notification.save()

    return notification
  }

  static markAllAsRead = async (userId: string | ObjectId) => {
    await NotificationModel.updateMany({ user: userId, isRead: false }, { isRead: true })
    return { message: 'All marked as read' }
  }

  static deleteNotification = async (userId: string | ObjectId, notificationId: string) => {
    const notification = await NotificationModel.findOne({ _id: notificationId, user: userId })
    if (!notification) throw new NotFoundError('Notification not found')

    notification.isDeleted = true
    notification.deletedAt = new Date()
    notification.deletedBy = new ObjectId(userId)
    await notification.save()

    return { message: 'Deleted successfully' }
  }
}

export default NotificationService
