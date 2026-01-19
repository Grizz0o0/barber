import { Socket } from 'socket.io'
import SocketService from './socket.services'
import MessageModel from '~/models/message.model'
import ConversationModel from '~/models/conversation.model'
import { logger } from '~/utils/logger.utils'

class ChatSocket {
  private socket: Socket

  constructor(socket: Socket) {
    this.socket = socket
  }

  public init() {
    this.socket.on('join_conversation', this.handleJoinConversation)
    this.socket.on('leave_conversation', this.handleLeaveConversation)
    this.socket.on('send_message', this.handleSendMessage)
    this.socket.on('join_admin_room', this.handleJoinAdminRoom)
  }

  private handleJoinAdminRoom = () => {
    logger.info(`User ${this.socket.id} joined admin room`)
    this.socket.join('admin_room')
  }

  private handleJoinConversation = (conversationId: string) => {
    logger.info(`User ${this.socket.id} joined conversation ${conversationId}`)
    this.socket.join(conversationId)
  }

  private handleLeaveConversation = (conversationId: string) => {
    logger.info(`User ${this.socket.id} left conversation ${conversationId}`)
    this.socket.leave(conversationId)
  }

  private handleSendMessage = async (data: { conversationId: string; sender: string; content: string }) => {
    try {
      const { conversationId, sender, content } = data

      // 1. Save message to DB
      const newMessage = await MessageModel.create({
        conversationId,
        sender,
        content
      })

      // 2. Update conversation last message
      await ConversationModel.findByIdAndUpdate(conversationId, {
        lastMessage: {
          content,
          sender,
          createdAt: new Date()
        }
      })

      // 3. Emit to room
      SocketService.getInstance().getIO().to(conversationId).emit('receive_message', newMessage)

      // 4. Emit notification to admin room (exclude if sender is admin, but currently sender is just ID string.
      // We can fetch user or just emit. Ideally front-end admin won't notify if sender is themselves)
      // For now, emit to all admins. Frontend can filter or show all.
      // Fetch sender info for better notification? Or just send content.
      // Let's attach senderId so frontend can check.
      SocketService.getInstance().getIO().to('admin_room').emit('new_message_notification', {
        conversationId,
        content,
        senderId: sender,
        createdAt: new Date()
      })
    } catch (error) {
      logger.error(`Error sending message: ${error}`)
      this.socket.emit('error', 'Failed to send message')
    }
  }
}

export default ChatSocket
