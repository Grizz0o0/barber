import { Schema, model } from 'mongoose'

const DOCUMENT_NAME = 'Message'
const COLLECTION_NAME = 'messages'

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME
  }
)

messageSchema.index({ conversationId: 1, createdAt: 1 })

export default model(DOCUMENT_NAME, messageSchema)
