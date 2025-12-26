import { Schema, model, Document, Types } from 'mongoose'

interface IReview extends Document {
  user: Types.ObjectId
  product?: Types.ObjectId
  booking?: Types.ObjectId
  barber?: Types.ObjectId
  rating: number
  comment?: string
  images: string[]
  reply?: string
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    barber: { type: Schema.Types.ObjectId, ref: 'User' }, // Denormalized for performance
    rating: { type: Number, min: [1, 'Rating từ 1-5'], max: [5, 'Rating từ 1-5'], required: true },
    comment: String,
    images: [{ type: String }],
    reply: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

reviewSchema.index({ user: 1, product: 1 }, { unique: true, sparse: true })
reviewSchema.index({ user: 1, booking: 1 }, { unique: true, sparse: true })

// Hook post-save can be used, but we calculate explicitly in Service for better control.

export default model<IReview>('Review', reviewSchema)
