import { Schema, model, Document, Types } from 'mongoose'

interface ICartItem {
  product: Types.ObjectId
  quantity: number
}

interface ICart extends Document {
  user: Types.ObjectId
  items: ICartItem[]
  totalPrice: number
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
}

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Người dùng là bắt buộc'], unique: true }, // Một cart per user
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 }
      }
    ],
    totalPrice: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

cartSchema.index({ user: 1 })

// Hook pre-save: Tính totalPrice tự động từ items (populate price từ Product)
cartSchema.pre('save', async function () {
  if (this.isModified('items')) {
    this.totalPrice = 0
    // Use a minimal interface for the product struct we need
    interface IProductWithPrice {
      price: number
    }

    const itemPromises = this.items.map(async (item) => {
      const product = await model<IProductWithPrice>('Product').findById(item.product)
      return product ? product.price * item.quantity : 0
    })

    const prices = await Promise.all(itemPromises)
    this.totalPrice = prices.reduce((a, b) => a + b, 0)
  }
})

export default model<ICart>('Cart', cartSchema)
