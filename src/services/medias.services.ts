import { Request } from 'express'

import path from 'node:path'
import sharp from 'sharp'
import { UPLOAD_DIR } from '~/constants/dir'
import { getNameFromFullname, handleUploadImage } from '~/utils/files.utils'
import fs from 'fs'
import envConfig from '~/config/env.config'
import { MediaType } from '~/constants/medias'
import { MediaTypeSchema, mediaSchema } from '~/requestSchemas/medias.request'

class MediasService {
  static async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: MediaTypeSchema[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename)
        const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        const isProduction = envConfig.NODE_ENV === 'pro'

        return mediaSchema.parse({
          name: `${newName}.jpg`,
          url: isProduction
            ? `${envConfig.HOST}/medias/static/image/${newName}.jpg`
            : `http://localhost:${envConfig.APP_PORT}/medias/static/image/${newName}.jpg`,
          type: MediaType.Image
        })
      })
    )

    return { files: result }
  }
}

export default MediasService
