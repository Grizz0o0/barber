import { Schema, model, Document, Types } from 'mongoose'
import Service from './serviceItem.model'

interface IBooking extends Document {
  user: Types.ObjectId
  barber: Types.ObjectId
  service: Types.ObjectId
  startTime: Date
  endTime: Date
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  notes?: string
  promotion?: Types.ObjectId
  discountAmount: number
  totalPrice: number
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
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    barber: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    startTime: { type: Date, required: [true, 'Thời gian bắt đầu là bắt buộc'] },
    endTime: { type: Date, required: [true, 'Thời gian kết thúc là bắt buộc'] },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    notes: String,
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
    this.endTime = new Date(this.startTime.getTime() + service.duration * 60000) // Chuyển phút sang ms
  }
  if (this.endTime <= this.startTime) {
    throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu')
  }
})

export default model<IBooking>('Booking', bookingSchema)
