import {
  createRefreshTokenTypeBody,
  updateRefreshTokenTypeBody,
  createRefreshTokenSchema,
  updateRefreshTokenSchema,
  findByUserIdSchema,
  findByRefreshTokenSchema,
  deleteByUserIdSchema
} from '~/requestSchemas/refreshTokens.request'
import RefreshTokenModel from '~/models/refreshTokens.model'
import { ObjectId } from 'mongodb'

class RefreshTokenService {
  static upsertRefreshToken = async ({ userId, refreshToken, expiresAt }: createRefreshTokenTypeBody) => {
    try {
      const validatedData = createRefreshTokenSchema.parse({ userId, refreshToken, expiresAt })

      const filter = { userId: validatedData.userId }
      const update = {
        $set: {
          refreshTokenUsed: [],
          refreshToken: validatedData.refreshToken,
          expiresAt: validatedData.expiresAt
        }
      }
      const option = { upsert: true, new: true }

      const tokens = await RefreshTokenModel.findOneAndUpdate(filter, update, option)
      return tokens?.refreshToken || null
    } catch (error) {
      throw new Error('Failed to create/update key token')
    }
  }

  static findByUserId = async (userId: string | ObjectId) => {
    const { userId: validatedUserId } = findByUserIdSchema.parse({ userId })
    return await RefreshTokenModel.findOne({ userId: validatedUserId })
  }

  static findByRefreshTokenUsed = async (refreshToken: string) => {
    const { refreshToken: validatedRefreshToken } = findByRefreshTokenSchema.parse({ refreshToken })

    return await RefreshTokenModel.findOne({ refreshTokened: validatedRefreshToken })
  }

  static findByRefreshToken = async (refreshToken: string) => {
    const { refreshToken: validatedRefreshToken } = findByRefreshTokenSchema.parse({ refreshToken })

    return await RefreshTokenModel.findOne({ refreshToken: validatedRefreshToken })
  }

  static deleteByUserId = async (userId: string | ObjectId) => {
    const { userId: validatedUserId } = deleteByUserIdSchema.parse({ userId })

    return await RefreshTokenModel.findOneAndDelete({ userId: validatedUserId })
  }

  static updateRefreshToken = async ({
    userId,
    refreshToken,
    newRefreshToken,
    newExpiresAt
  }: updateRefreshTokenTypeBody) => {
    const validatedData = updateRefreshTokenSchema.parse({
      userId,
      refreshToken,
      newRefreshToken,
      newExpiresAt
    })

    const filter = { userId: validatedData.userId },
      update = {
        $set: { refreshToken: validatedData.newRefreshToken, expiresAt: validatedData.newExpiresAt },
        $addToSet: { refreshTokenUsed: validatedData.refreshToken }
      },
      option = { new: true }
    return await RefreshTokenModel.findOneAndUpdate(filter, update, option)
  }
}

export default RefreshTokenService
