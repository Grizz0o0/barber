import { z } from 'zod'
import { NotificationType } from '~/models/notification.model'

// Chủ yếu dùng cho Admin gửi thông báo hệ thống hoặc test
export const createNotificationSchema = {
  body: z.object({
    title: z.string().min(1, 'Tiêu đề không được trống'),
    message: z.string().min(1, 'Nội dung không được trống'),
    type: z.nativeEnum(NotificationType).optional(),
    referenceId: z.string().optional(),
    userId: z.string().optional() // Nếu admin gửi đích danh
  })
}

export type CreateNotificationReqBody = z.infer<typeof createNotificationSchema.body>

export const getNotificationSchema = {
  query: z.object({
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    type: z.nativeEnum(NotificationType).optional(),
    isRead: z.enum(['true', 'false']).optional()
  })
}

export type GetNotificationQuery = z.infer<typeof getNotificationSchema.query>
