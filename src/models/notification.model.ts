import { Schema, model, Document, Types } from 'mongoose'

export enum NotificationType {
  System = 'System',
  Booking = 'Booking',
  Order = 'Order',
  Payment = 'Payment',
  Promotion = 'Promotion',
  Review = 'Review'
}

export interface INotification extends Document {
  user: Types.ObjectId
  title: string
  message: string
  type: NotificationType
  referenceId?: Types.ObjectId // Có thể là BookingId, OrderId, ReviewId...
  isRead: boolean
  isDeleted: boolean
  deletedAt?: Date
  deletedBy?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.System
    },
    referenceId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, isRead: 1 })

export default model<INotification>('Notification', notificationSchema)
