import { Schema, model, Document, Types } from 'mongoose'

export interface IRefreshToken extends Document {
  userId: Types.ObjectId
  refreshToken?: string
  refreshTokened: string[]
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    refreshToken: {
      type: String
    },
    refreshTokened: {
      type: [String],
      default: []
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: { expires: 0 }
    }
  },
  {
    timestamps: true,
    collection: 'refreshTokens'
  }
)

const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema)

export default RefreshToken
