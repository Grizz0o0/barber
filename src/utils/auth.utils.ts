import { sign } from 'jsonwebtoken'
import { CreateTokenPairParams } from '~/types/auths.types'

export const createAccessToken = async ({ payload, secretKey }: CreateTokenPairParams) => {
  try {
    return await sign(payload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '2days'
    })
  } catch (error) {
    console.error('Error creating access token:', error)
    return null
  }
}

export const createRefreshToken = async ({ payload, secretKey }: CreateTokenPairParams) => {
  try {
    return await sign(payload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '7days'
    })
  } catch (error) {
    console.error('Error creating refresh token:', error)
    return null
  }
}

export const createForgotPasswordToken = async ({ payload, secretKey }: CreateTokenPairParams) => {
  try {
    return await sign(payload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '15m'
    })
  } catch (error) {
    console.error('Error creating forgot password token:', error)
    return null
  }
}

export const createVerifyEmailToken = async ({ payload, secretKey }: CreateTokenPairParams) => {
  try {
    return await sign(payload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '1h'
    })
  } catch (error) {
    console.error('Error creating verify email token:', error)
    return null
  }
}
