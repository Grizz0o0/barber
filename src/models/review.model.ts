import { Schema, model, Document, Types } from 'mongoose'

interface IReview extends Document {
  user: Types.ObjectId
  product?: Types.ObjectId
  booking?: Types.ObjectId
  rating: number
  comment?: string
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
    rating: { type: Number, min: [1, 'Rating từ 1-5'], max: [5, 'Rating từ 1-5'], required: true },
    comment: String,
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

// Gợi ý hook post-save để update avg rating (thêm field avgRating ở Product/Service nếu cần)
reviewSchema.post('save', async function (doc) {
  // Logic tính avg rating cho product hoặc booking (sử dụng aggregation)
})

export default model<IReview>('Review', reviewSchema)
