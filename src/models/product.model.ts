import { Schema, model, Document, Types } from 'mongoose'

interface IProduct extends Document {
  name: string
  category: 'keo' | 'gôm' | 'wax' | 'dầu gội' | 'khác'
  price: number
  stock: number
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

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: [true, 'Tên sản phẩm là bắt buộc'] },
    category: { type: String, enum: ['keo', 'gôm', 'wax', 'dầu gội', 'khác'], default: 'khác' },
    price: { type: Number, required: [true, 'Giá là bắt buộc'], min: [0, 'Giá phải >= 0'] },
    stock: { type: Number, default: 0, min: [0, 'Kho phải >= 0'] },
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

productSchema.index({ name: 'text' })
productSchema.index({ category: 1 })

export default model<IProduct>('Product', productSchema)
