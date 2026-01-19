import { Schema, model } from 'mongoose'

const DOCUMENT_NAME = 'Conversation'
const COLLECTION_NAME = 'conversations'

const conversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: {
      content: { type: String },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date }
    },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME
  }
)

// Index for faster queries of user's conversations
conversationSchema.index({ participants: 1 })

export default model(DOCUMENT_NAME, conversationSchema)
