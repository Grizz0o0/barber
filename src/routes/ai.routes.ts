import { Router } from 'express'
import aiController from '~/controllers/ai.controllers'
import { asyncHandler } from '~/helpers/asyncHandler'

const aiRouter = Router()

aiRouter.post('/consult', asyncHandler(aiController.consult))
aiRouter.post('/chat', asyncHandler(aiController.chat))

export default aiRouter
