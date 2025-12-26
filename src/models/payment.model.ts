import { Schema, model, Document, Types } from 'mongoose'

interface IPayment extends Document {
  paymentFor: 'order' | 'booking'
  order?: Types.ObjectId
  booking?: Types.ObjectId
  amount: number
  paymentMethod?: 'COD' | 'VNPay' | 'Momo' | 'Bank'
  status: 'pending' | 'success' | 'failed'
  transactionId?: string
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentFor: { type: String, enum: ['order', 'booking'], required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    amount: { type: Number, required: [true, 'Số tiền là bắt buộc'], min: 0 },
    paymentMethod: { type: String, enum: ['COD', 'VNPay', 'Momo', 'Bank'] },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    transactionId: { type: String, unique: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

paymentSchema.index({ order: 1 })
paymentSchema.index({ booking: 1 })
paymentSchema.index({ status: 1 })

export default model<IPayment>('Payment', paymentSchema)
