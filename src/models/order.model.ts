import mongoose, { Schema, model, Document, Types } from 'mongoose'
import Product from './product.model'

interface IOrderItem {
  product: Types.ObjectId
  nameAtPurchase: string
  priceAtPurchase: number
  quantity: number
}

interface IOrder extends Document {
  user: Types.ObjectId
  items: IOrderItem[]
  totalPrice: number
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: {
    street: string
    district?: string
    city: string
    country: string
  }
  promotion?: Types.ObjectId
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        nameAtPurchase: { type: String, required: true },
        priceAtPurchase: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 }
      }
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
    shippingAddress: {
      street: { type: String, required: true },
      district: String,
      city: { type: String, required: true },
      country: { type: String, default: 'Vietnam' }
    },
    promotion: { type: Schema.Types.ObjectId, ref: 'Promotion' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

orderSchema.index({ user: 1 })
orderSchema.index({ status: 1 })

// Hook pre-save: Giảm stock
orderSchema.pre('save', async function () {
  // 1. Xử lý trừ kho khi tạo đơn mới
  if (this.isNew) {
    for (const item of this.items) {
      const product = await Product.findById(item.product)
      if (!product || product.stock < item.quantity) {
        throw new Error(`Sản phẩm ${item.nameAtPurchase} không đủ hàng`)
      }
      product.stock -= item.quantity
      await product.save()
    }
  }

  // 2. Xử lý hoàn kho khi HỦY ĐƠN (Nếu trạng thái chuyển sang cancelled)
  if (this.isModified('status') && this.status === 'cancelled') {
    // Chỉ hoàn kho nếu đơn hàng trước đó chưa bị hủy
    // (Logic này nên check kỹ hơn ở Controller để tránh cộng dồn nhiều lần)
    for (const item of this.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      })
    }
  }
})
export default model<IOrder>('Order', orderSchema)
