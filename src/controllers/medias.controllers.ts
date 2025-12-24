import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { Created, OK } from '~/responses/success.response'
import MediasService from '~/services/medias.services'
import path from 'node:path'
import { UPLOAD_DIR } from '~/constants/dir'
import { staticImageSchema, staticImageTypeParams } from '~/requestSchemas/medias.request'

class MediasController {
  uploadImage = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {
    try {
      const uploadResult = await MediasService.uploadImage(req)
      new Created({
        message: 'Upload file image success',
        metadata: { image: uploadResult }
      }).send(res)
    } catch (error) {
      next(error)
    }
  }

  staticImage = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {
    try {
      const { name } = staticImageSchema.params.parse(req.params)
      return res.sendFile(path.resolve(UPLOAD_DIR, name))
    } catch (error) {
      next(error)
    }
  }
}

export default new MediasController()
