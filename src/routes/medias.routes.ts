import { Router } from 'express'
import mediasControllers from '~/controllers/medias.controllers'
import { asyncHandler } from '~/helpers/asyncHandler'
import { validateRequest } from '~/middlewares/validate.middleware'
import { staticImageSchema } from '~/requestSchemas/medias.request'
import { authenticationSchema } from '~/requestSchemas/auth.request'
import { authentication } from '~/middlewares/auth.middlewares'

const mediasRouter = Router()
mediasRouter.get(
  '/static/image/:name',
  validateRequest({ params: staticImageSchema.params }),
  asyncHandler(mediasControllers.staticImage)
)
mediasRouter.use(validateRequest({ headers: authenticationSchema }), authentication)
mediasRouter.post('/upload-image', asyncHandler(mediasControllers.uploadImage))

export default mediasRouter
