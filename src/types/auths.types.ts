import { JwtPayload } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

// Re-export types from type.d.ts
export interface KeyStore {
  userId: string | ObjectId
  refreshToken?: string
  refreshTokened?: string[]
  expiresAt: Date
  [key: string]: any
}

export interface User {
  userId: string | ObjectId
  [key: string]: any
}

export interface TokenPayload extends JwtPayload {
  userId: string | ObjectId
  [key: string]: any
}

export interface CreateTokenPairParams {
  payload: TokenPayload
  secretKey: string
}

export interface GoogleTokenBody {
  access_token: string
  refresh_token: string
  expires_in: string
  scope: string
  token_type: string
  id_token: string
}

export interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
}
