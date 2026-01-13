import { Schema, model, Document, Types } from 'mongoose'

interface IService extends Document {
  name: string
  price: number
  duration: number
  bufferTime?: number
  description?: string
  images?: string[]
  isActive: boolean
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const ServiceItemSchema = new Schema<IService>(
  {
    name: { type: String, required: [true, 'Tên dịch vụ là bắt buộc'] },
    price: { type: Number, required: [true, 'Giá là bắt buộc'], min: [0, 'Giá phải >= 0'] },
    duration: { type: Number, required: [true, 'Thời lượng là bắt buộc'], min: [15, 'Thời lượng ít nhất 15 phút'] },
    bufferTime: { type: Number, default: 0, min: [0, 'Thời gian đệm phải >= 0'] },
    description: String,
    images: [String],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

ServiceItemSchema.index({ name: 1 })

export default model<IService>('ServiceItem', ServiceItemSchema)
