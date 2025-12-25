import { Schema, model, Document, Types } from 'mongoose'

interface INotification extends Document {
  user: Types.ObjectId
  type: 'booking_reminder' | 'order_update' | 'promo' | 'other'
  content: string
  sentAt?: Date
  status: 'pending' | 'sent' | 'failed'
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Người dùng là bắt buộc'] },
    type: { type: String, enum: ['booking_reminder', 'order_update', 'promo', 'other'], required: true },
    content: { type: String, required: [true, 'Nội dung thông báo là bắt buộc'] },
    sentAt: Date,
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1 })
notificationSchema.index({ status: 1 })
notificationSchema.index({ type: 1 })

// Hook pre-save: Set sentAt nếu status là 'sent'
notificationSchema.pre('save', function () {
  if (this.isModified('status') && this.status === 'sent') {
    this.sentAt = new Date()
  }
})

export default model<INotification>('Notification', notificationSchema)
