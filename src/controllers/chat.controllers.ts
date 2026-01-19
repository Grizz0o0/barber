import { Request, Response } from 'express'
import { Types } from 'mongoose'
import ConversationModel from '~/models/conversation.model'
import MessageModel from '~/models/message.model'
import { SuccessResponse } from '~/responses/success.response'
import { ErrorResponse } from '~/responses/error.response'
import SocketService from '~/services/socket.services'

class ChatController {
  // Get all conversations for the current user (or all if admin)
  // For simplicity: Admin gets all, User gets theirs.
  static getConversations = async (req: Request, res: Response) => {
    const userId = req.keyStore!.userId
    // Check if admin? For now assume endpoint differentiates or returns all relevant.
    // Let's implement: User sees their own conversation. Admin sees all.
    // Need a way to check role from request, usually req.user or req.keyStore.
    // Assuming simple logic for now: query by participant.

    // NOTE: In a real app we check roles. Here we'll just return conversations where user is participant.
    // If we want Admin to see all, we need role check.

    const conversations = await ConversationModel.find({
      participants: userId
    })
      .populate('participants', 'name email avatar')
      .sort({ updatedAt: -1 })
      .lean()

    new SuccessResponse({
      message: 'Get conversations success',
      metadata: conversations
    }).send(res)
  }

  // Admin: Get ALL conversations
  static getAllConversations = async (req: Request, res: Response) => {
    const conversations = await ConversationModel.find({})
      .populate('participants', 'name email avatar phone')
      .sort({ updatedAt: -1 })
      .lean()

    new SuccessResponse({
      message: 'Get all conversations success',
      metadata: conversations
    }).send(res)
  }

  // Get messages for a specific conversation
  static getMessages = async (req: Request, res: Response) => {
    const { conversationId } = req.params
    const limit = 50
    // Pagination can be added later

    const messages = await MessageModel.find({
      conversationId,
      isDeleted: { $ne: true }
    })
      .sort({ createdAt: 1 }) // Oldest first for chat history
      // .limit(limit)
      .lean()

    new SuccessResponse({
      message: 'Get messages success',
      metadata: messages
    }).send(res)
  }

  // Create or Get conversation with Admin
  // When a user starts chat, we ensure a conversation exists between them and the 'System/Admin'
  // Or simply: A conversation is just participants.
  // We can treat this as "Get my support conversation"
  static getMyConversation = async (req: Request, res: Response) => {
    const userId = req.keyStore!.userId

    // Find conversation where verify participants includes userId (and maybe specific type?)
    // For now, simple: One conversation per user.
    let conversation = await ConversationModel.findOne({
      participants: userId
    })

    if (!conversation) {
      conversation = await ConversationModel.create({
        participants: [new Types.ObjectId(userId.toString())], // In future, add Admin ID if needed, or just 1 participant implies "User vs System"
        lastMessage: {
          content: 'Xin chào, tôi có thể giúp gì cho bạn?',
          createdAt: new Date(),
          sender: null // System
        }
      })
    }

    new SuccessResponse({
      message: 'Get my conversation success',
      metadata: conversation
    }).send(res)
  }

  // Soft delete message
  static deleteMessage = async (req: Request, res: Response) => {
    const { messageId } = req.params
    const userId = req.keyStore!.userId

    const message = await MessageModel.findOne({
      _id: new Types.ObjectId(messageId)
    })

    if (!message) throw new ErrorResponse('Message not found', 404)

    // Check ownership (sender can delete, or maybe admin can delete anyone's?)
    // For now: Only sender can delete their own message.
    const role = req.user?.role
    if (message.sender.toString() !== userId && role !== 'admin') {
      throw new ErrorResponse('Permission denied', 403)
    }

    message.isDeleted = true
    await message.save()

    // Emit event to conversation room
    // Note: We need a way to access Socket Service here.
    // Ideally SocketService should be imported.
    SocketService.getInstance().getIO().to(message.conversationId.toString()).emit('message_deleted', {
      messageId,
      conversationId: message.conversationId
    })

    new SuccessResponse({
      message: 'Delete message success',
      metadata: { success: true }
    }).send(res)
  }
}

export default ChatController
