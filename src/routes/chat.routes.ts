import express from 'express'
import ChatController from '~/controllers/chat.controllers'
import { authentication } from '~/middlewares/auth.middlewares' // Assuming this exists
import { asyncHandler } from '~/helpers/asyncHandler'

const router = express.Router()

// Apply authentication to all chat routes
router.use(authentication)

router.get('/conversations', asyncHandler(ChatController.getConversations))
router.get('/conversations/all', asyncHandler(ChatController.getAllConversations)) // Should add admin check middleware
router.get('/my-conversation', asyncHandler(ChatController.getMyConversation))
router.get('/messages/:conversationId', asyncHandler(ChatController.getMessages))
router.delete('/messages/:messageId', asyncHandler(ChatController.deleteMessage))

export default router
