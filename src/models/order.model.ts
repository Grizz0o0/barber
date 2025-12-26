import mongoose, { Schema, model, Document, Types } from 'mongoose'

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

// Hook pre-save: Removed Stock Logic to Service
// Stock management should be handled in Service for Transaction support and better error handling.
export default model<IOrder>('Order', orderSchema)
