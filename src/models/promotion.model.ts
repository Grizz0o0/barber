import { Schema, model, Document, Types } from 'mongoose'

interface IPromotion extends Document {
  code: string
  discountPercent?: number
  discountValue?: number // Giảm giá theo số tiền cố định (e.g. 50k)
  maxDiscountValue?: number // Giảm tối đa (cho trường hợp %)
  minOrderValue: number
  expiryDate: Date
  maxUsage?: number
  usedCount: number
  applicableTo: 'product' | 'service' | 'all'
  isActive: boolean
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const promotionSchema = new Schema<IPromotion>(
  {
    code: { type: String, unique: true, required: [true, 'Mã khuyến mãi là bắt buộc'] },
    discountPercent: { type: Number, min: [0, 'Giảm giá >=0'], max: [100, 'Giảm giá <=100'] },
    discountValue: { type: Number, min: [0, 'Số tiền giảm >= 0'] },
    maxDiscountValue: { type: Number, min: [0, 'Giảm tối đa >= 0'] },
    minOrderValue: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, required: [true, 'Ngày hết hạn là bắt buộc'] },
    maxUsage: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0 },
    applicableTo: { type: String, enum: ['product', 'service', 'all'], default: 'all' },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

promotionSchema.pre('save', async function () {
  if (this.isNew && this.expiryDate <= new Date()) {
    throw new Error('Ngày hết hạn phải sau ngày hiện tại')
  }
})

export default model<IPromotion>('Promotion', promotionSchema)
