import { TokenPayload, KeyStore } from './types/auths.types'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
      keyStore?: KeyStore
      refreshToken?: string
    }
  }
}
