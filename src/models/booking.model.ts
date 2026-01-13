import { Schema, model, Document, Types } from 'mongoose'
import Service from './serviceItem.model'
import { BookingStatus, PaymentStatus } from '~/constants/booking'

export interface IBooking extends Document {
  user?: Types.ObjectId
  guestName?: string
  guestPhone?: string
  barber: Types.ObjectId
  service: Types.ObjectId
  startTime: Date
  endTime: Date
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  notes?: string
  promotion?: Types.ObjectId
  discountAmount: number
  totalPrice: number
  source: 'online' | 'walk-in' | 'admin'
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const bookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Make User optional for Guest
    guestName: { type: String },
    guestPhone: { type: String },
    barber: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'ServiceItem', required: true },
    startTime: { type: Date, required: [true, 'Thời gian bắt đầu là bắt buộc'] },
    endTime: { type: Date, required: [true, 'Thời gian kết thúc là bắt buộc'] },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.Pending
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Unpaid
    },
    notes: String,
    source: {
      type: String,
      enum: ['online', 'walk-in', 'admin'],
      default: 'online'
    },
    promotion: { type: Schema.Types.ObjectId, ref: 'Promotion' },
    discountAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

bookingSchema.index({ barber: 1, startTime: 1 })
bookingSchema.index({ user: 1 })
bookingSchema.index({ status: 1 })
bookingSchema.index({ createdAt: -1 })
bookingSchema.index({ user: 1, createdAt: -1 })
bookingSchema.index({ status: 1, createdAt: -1 })

// Hook pre-save: Tính endTime từ duration của Service và validate
bookingSchema.pre('save', async function () {
  if (this.isNew || this.isModified('startTime') || this.isModified('service')) {
    const service = await Service.findById(this.service)
    if (!service) throw new Error('Dịch vụ không tồn tại')
    const buffer = service.bufferTime || 0
    this.endTime = new Date(this.startTime.getTime() + (service.duration + buffer) * 60000) // Chuyển phút sang ms (+ buffer)
  }
  if (this.endTime <= this.startTime) {
    throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu')
  }
})

export default model<IBooking>('Booking', bookingSchema)
