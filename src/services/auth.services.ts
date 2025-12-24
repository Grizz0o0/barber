import envConfig from '~/config/env.config'
import bcrypt from 'bcrypt'
import {
  createAccessToken,
  createRefreshToken,
  createForgotPasswordToken,
  createVerifyEmailToken
} from '~/utils/auth.utils'
import {
  registerReqBodyType,
  loginReqBodyType,
  forgotPasswordReqBodyType,
  verifyForgotPasswordReqBodyType,
  resetPasswordReqBodyType,
  changePasswordReqBodyType,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyForgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  registerGoogleReqBodyType,
  registerGoogleSchema,
  verifyEmailReqBodyType,
  verifyEmailSchema,
  resendForgotPasswordReqBodyType,
  resendForgotPasswordSchema,
  resendVerifyEmailReqBodyType,
  resendVerifyEmailSchema
} from '~/requestSchemas/auth.request'
import UserModel from '~/models/user.model'
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '~/responses/error.response'
import RefreshTokenService from '~/services/refreshToken.services'
import { getInfoData } from '~/utils/object.utils'
import { verifyToken } from '~/utils/jwt.utils'
import { UserAuthProvider, UserRole, UserVerifyStatus } from '~/constants/user'
import axios from 'axios'
import { generateRandomPassword } from '~/utils/crypto.utils'
import { GoogleTokenBody, GoogleUserInfo } from '~/types/auths.types'
import { sendForgotPasswordEmail, sendVerifyEmailRegister } from '~/utils/email.utils'
import { ObjectId } from 'mongodb'

class AuthService {
  static login = async (payload: loginReqBodyType) => {
    const parseResult = await loginSchema.body.safeParseAsync(payload)
    if (!parseResult.success) {
      throw new BadRequestError('Invalid login data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors))
    }
    const validatedData = parseResult.data

    const foundUser = await UserModel.findOne({ email: validatedData.email })
    if (!foundUser) throw new NotFoundError('Tài khoản chưa được tạo')

    const isPasswordMatch = await bcrypt.compare(validatedData.password, foundUser.password)
    if (!isPasswordMatch) throw new BadRequestError('Mật khẩu không chính xác')

    if (foundUser.verify !== UserVerifyStatus.Verified)
      throw new ForbiddenError('Tài khoản chưa được xác thực. Vui lòng kiểm tra email')

    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken({
        payload: {
          userId: foundUser._id.toString(),
          email: foundUser.email,
          role: foundUser.role,
          verify: foundUser.verify
        },
        secretKey: envConfig.JWT_SECRET_ACCESS_TOKEN
      }),
      createRefreshToken({
        payload: {
          userId: foundUser._id.toString(),
          email: foundUser.email,
          role: foundUser.role,
          verify: foundUser.verify
        },
        secretKey: envConfig.JWT_SECRET_REFRESH_TOKEN
      })
    ])

    if (!accessToken || !refreshToken) throw new BadRequestError('Error creating tokens')
    const decodeRefreshToken = await verifyToken(refreshToken, envConfig.JWT_SECRET_REFRESH_TOKEN)
    await RefreshTokenService.upsertRefreshToken({
      userId: foundUser._id,
      refreshToken,
      expiresAt: new Date((decodeRefreshToken.exp as number) * 1000)
    })
    return {
      user: getInfoData({ fields: ['_id', 'name', 'email', 'phone', 'role', 'verify'], object: foundUser }),
      tokens: { accessToken, refreshToken }
    }
  }

  static register = async (payload: registerReqBodyType | registerGoogleReqBodyType, isGoogle = false) => {
    let parseResult
    if (isGoogle) {
      parseResult = await registerGoogleSchema.safeParseAsync(payload)
    } else {
      parseResult = await registerSchema.body.safeParseAsync(payload)
    }
    if (!parseResult.success) {
      throw new BadRequestError('Invalid registration data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors))
    }
    const validatedData = parseResult.data
    // Kiểm tra email đã tồn tại chưa
    const holderUser = await UserModel.findOne({ email: validatedData.email })
    if (holderUser) throw new BadRequestError('Email đã được sử dụng !')

    // Kiểm tra name đã tồn tại chưa
    const existingName = await UserModel.findOne({ name: validatedData.name })
    if (existingName) throw new BadRequestError('Tên người dùng đã được sử dụng !')

    try {
      // Mã hóa mật khẩu
      const passwordHash = bcrypt.hashSync(validatedData.password, 10)

      const newUser = await UserModel.create({
        ...validatedData,
        password: passwordHash,
        role: UserRole.Customer,
        verify: UserVerifyStatus.Unverified,
        authProvider: UserAuthProvider.Local,
        isActive: true
      })

      const verifyEmailToken = await createVerifyEmailToken({
        payload: { userId: newUser._id.toString(), email: newUser.email, role: newUser.role },
        secretKey: envConfig.JWT_SECRET_VERIFY_EMAIL_TOKEN
      })
      if (!verifyEmailToken) throw new BadRequestError('Error creating verify email token')

      const foundUser = await UserModel.findByIdAndUpdate(
        newUser._id,
        {
          $set: { verifyEmailToken }
        },
        { new: true }
      )

      if (!foundUser) throw new NotFoundError('Đăng kí tài khoản thất bại')

      if (!isGoogle) {
        try {
          await sendVerifyEmailRegister(foundUser.email, verifyEmailToken)
        } catch (error) {
          throw new BadRequestError('Gửi email thất bại, vui lòng thử lại.')
        }
      }
      // Tạo token
      const [accessToken, refreshToken] = await Promise.all([
        createAccessToken({
          payload: { userId: foundUser._id.toString(), email: foundUser.email, role: foundUser.role },
          secretKey: envConfig.JWT_SECRET_ACCESS_TOKEN
        }),
        createRefreshToken({
          payload: { userId: foundUser._id.toString(), email: foundUser.email, role: foundUser.role },
          secretKey: envConfig.JWT_SECRET_REFRESH_TOKEN
        })
      ])
      if (!accessToken || !refreshToken) throw new BadRequestError('Error creating tokens')

      // Lưu refresh token
      const decodeRefreshToken = await verifyToken(refreshToken, envConfig.JWT_SECRET_REFRESH_TOKEN)
      await RefreshTokenService.upsertRefreshToken({
        userId: foundUser._id,
        refreshToken,
        expiresAt: new Date((decodeRefreshToken.exp as number) * 1000)
      })

      return {
        user: getInfoData({ fields: ['_id', 'name', 'email', 'phone', 'role'], object: foundUser }),
        tokens: { accessToken, refreshToken }
      }
    } catch (error) {
      // Xử lý các lỗi khác trong quá trình đăng ký
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error
      }
      console.error('Registration error:', error)
      throw new BadRequestError('Registration failed. Please try again later.')
    }
  }

  private static async getOAuthGoogleToken(code: string) {
    // Kiểm tra các biến môi trường OAuth cần thiết
    if (!envConfig.GOOGLE_CLIENT_ID || !envConfig.GOOGLE_CLIENT_SECRET || !envConfig.GOOGLE_REDIRECT_URI) {
      throw new BadRequestError('Missing OAuth environment variables')
    }

    const body = {
      code,
      client_id: envConfig.GOOGLE_CLIENT_ID,
      client_secret: envConfig.GOOGLE_CLIENT_SECRET,
      redirect_uri: envConfig.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }

    try {
      const { data } = await axios.post<GoogleTokenBody>('https://oauth2.googleapis.com/token', body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return data
    } catch (error) {
      console.error('Error getting Google OAuth token:', error)
      throw new BadRequestError('Failed to get Google OAuth token')
    }
  }

  private static async getGoogleUserInfo(access_token: string, id_token: string) {
    try {
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        params: {
          access_token,
          alt: 'json'
        },
        headers: {
          Authorization: `Bearer ${id_token}`
        }
      })
      return data as GoogleUserInfo
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired access token')
    }
  }

  static oAuthGoogle = async (code: string) => {
    try {
      const { access_token, id_token } = await this.getOAuthGoogleToken(code)
      const userInfo = await this.getGoogleUserInfo(access_token, id_token)
      if (!userInfo.verified_email) {
        throw new ForbiddenError('Google email is not verified')
      }

      const foundUser = await UserModel.findOne({ email: userInfo.email })
      let accessToken, refreshToken, userId, role
      // Nếu tài khoản đã được tạo trước đấy rồi
      if (foundUser?.email) {
        ;[accessToken, refreshToken] = await Promise.all([
          createAccessToken({
            payload: {
              userId: foundUser._id.toString(),
              email: foundUser.email,
              role: foundUser.role,
              verify: UserVerifyStatus.Verified
            },
            secretKey: envConfig.JWT_SECRET_ACCESS_TOKEN
          }),
          createRefreshToken({
            payload: {
              userId: foundUser._id.toString(),
              email: foundUser.email,
              role: foundUser.role,
              verify: UserVerifyStatus.Verified
            },
            secretKey: envConfig.JWT_SECRET_REFRESH_TOKEN
          })
        ])
        if (!accessToken || !refreshToken) throw new BadRequestError('Error creating tokens')

        const decodeRefreshToken = await verifyToken(refreshToken, envConfig.JWT_SECRET_REFRESH_TOKEN)
        await RefreshTokenService.upsertRefreshToken({
          userId: foundUser._id,
          refreshToken,
          expiresAt: new Date((decodeRefreshToken.exp as number) * 1000)
        })
        userId = foundUser._id
      }

      // Nếu tài khoản chưa được tạo trước đấy => Tạo tài khoản mới
      else {
        const password = generateRandomPassword()
        const payload = {
          name: userInfo.name,
          email: userInfo.email,
          password,
          confirm_password: password,
          phone: '',
          verify: UserVerifyStatus.Verified,
          avatar: userInfo.picture,
          authProvider: UserAuthProvider.Google
        }
        const metadata = await this.register(payload, true)
        accessToken = metadata?.tokens.accessToken
        refreshToken = metadata?.tokens.refreshToken
        userId = metadata?.user._id
        role = metadata?.user.role
      }
      return { userId, accessToken, refreshToken, role }
    } catch (error) {
      throw new UnauthorizedError(`Google OAuth failed`)
    }
  }

  static logout = async (keyStore: any) => {
    const del = await RefreshTokenService.deleteByUserId(keyStore.userId)
    return getInfoData({ fields: ['_id', 'user'], object: del })
  }

  static handlerRefreshToken = async (refreshToken: string) => {
    // Kiểm tra refreshToken hết hạn chưa. Nếu hết hạn thì buộc logout
    const foundToken = await RefreshTokenService.findByRefreshTokenUsed(refreshToken)
    if (foundToken) {
      const { userId, email, role } = await verifyToken(refreshToken, envConfig.JWT_SECRET_REFRESH_TOKEN)

      await RefreshTokenService.deleteByUserId(userId.toString())
      throw new BadRequestError('Something wrong happen !! pls relogin')
    }

    // RefreshToken chưa hết hạn
    const holderToken = await RefreshTokenService.findByRefreshToken(refreshToken)
    if (!holderToken) throw new UnauthorizedError('User not registered')
    const { userId, email, role, verify } = await verifyToken(refreshToken, envConfig.JWT_SECRET_REFRESH_TOKEN)

    const [accessToken, newRefreshToken] = await Promise.all([
      createAccessToken({
        payload: { userId, email, role, verify },
        secretKey: envConfig.JWT_SECRET_ACCESS_TOKEN
      }),
      createRefreshToken({
        payload: { userId, email, role, verify },
        secretKey: envConfig.JWT_SECRET_REFRESH_TOKEN
      })
    ])

    if (!accessToken || !newRefreshToken) throw new BadRequestError('Error creating tokens')

    const decodeRefreshToken = await verifyToken(newRefreshToken, envConfig.JWT_SECRET_REFRESH_TOKEN)
    const newTokens = await RefreshTokenService.updateRefreshToken({
      userId: holderToken.userId,
      refreshToken,
      newRefreshToken: newRefreshToken,
      newExpiresAt: new Date((decodeRefreshToken.exp as number) * 1000)
    })

    return {
      user: { userId, email, role },
      tokens: { accessToken, ...getInfoData({ fields: ['refreshToken', 'refreshTokenUsed'], object: newTokens }) }
    }
  }

  static resendVerifyEmail = async (payload: resendVerifyEmailReqBodyType) => {
    const parseResult = await resendVerifyEmailSchema.body.safeParseAsync(payload)
    if (!parseResult.success) {
      throw new BadRequestError('Invalid resend email data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors))
    }

    const { email } = parseResult.data

    const foundUser = await UserModel.findOne({ email })
    if (!foundUser) throw new NotFoundError('Email not registered')
    if (foundUser.verify === UserVerifyStatus.Verified) {
      throw new BadRequestError('Email already verified')
    }

    // Tạo token verify email
    const secretKey = envConfig.JWT_SECRET_VERIFY_EMAIL_TOKEN
    const verifyEmailToken = (await createVerifyEmailToken({
      payload: {
        userId: foundUser._id.toString(),
        email: foundUser.email,
        role: foundUser.role,
        type: 'verify-email'
      },
      secretKey
    })) as string

    await UserModel.updateOne(
      { _id: foundUser._id },
      {
        $set: { verifyEmailToken },
        $currentDate: { updatedAt: true }
      }
    )

    try {
      await sendVerifyEmailRegister(foundUser.email, verifyEmailToken as string)
    } catch (error) {
      console.error(error)
      throw new BadRequestError('Gửi email thất bại, vui lòng thử lại.')
    }

    return { email: foundUser.email, verifyEmailToken }
  }

  static forgotPassword = async (payload: forgotPasswordReqBodyType) => {
    const parseResult = await forgotPasswordSchema.body.safeParseAsync(payload)
    if (!parseResult.success) {
      throw new BadRequestError(
        'Invalid forgot password data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors)
      )
    }
    const validatedData = parseResult.data

    const foundUser = await UserModel.findOne({ email: validatedData.email })
    if (!foundUser) throw new NotFoundError('Email not registered')
    const secretKey = envConfig.JWT_SECRET_FORGOT_PASSWORD_TOKEN
    const forgotPasswordToken = await createForgotPasswordToken({
      payload: {
        userId: foundUser._id.toString(),
        email: foundUser.email,
        role: foundUser.role,
        type: 'forgot-password'
      },
      secretKey
    })
    console.log(foundUser)
    try {
      await sendForgotPasswordEmail(validatedData.email, forgotPasswordToken as string)
    } catch (error) {
      throw new BadRequestError('Gửi email thất bại, vui lòng thử lại.')
    }
    await UserModel.updateOne(
      { _id: foundUser._id },
      {
        $set: { forgotPasswordToken: forgotPasswordToken as string },
        $currentDate: {
          updatedAt: true
        }
      }
    )
    return { email: foundUser.email, forgotPasswordToken }
  }

  static verifyEmail = async (payload: verifyEmailReqBodyType) => {
    const parseResult = await verifyEmailSchema.body.safeParseAsync(payload)
    if (!parseResult.success) {
      throw new BadRequestError('Invalid verification data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors))
    }
    const validatedData = parseResult.data
    const decode = await verifyToken(validatedData.verifyEmailToken, envConfig.JWT_SECRET_VERIFY_EMAIL_TOKEN)
    if (!decode) throw new BadRequestError('verify_token decode fail')

    const user = await UserModel.findById(decode.userId)
    if (!user) throw new BadRequestError('User not found')

    if (user.verify === UserVerifyStatus.Verified) return decode

    const result = await UserModel.findByIdAndUpdate(decode.userId, {
      $set: { verify: UserVerifyStatus.Verified },
      $unset: { verifyEmailToken: '' },
      $currentDate: {
        updatedAt: true
      }
    })
    if (!result) throw new BadRequestError('Verify Email failed')
    return decode
  }

  static resendVerifyForgotPasswordEmail = async (payload: resendForgotPasswordReqBodyType) => {
    const parseResult = await resendForgotPasswordSchema.body.safeParseAsync(payload)
    if (!parseResult.success) {
      throw new BadRequestError('Invalid resend email data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors))
    }

    const { email } = parseResult.data

    const foundUser = await UserModel.findOne({ email })
    if (!foundUser) throw new NotFoundError('Email not registered')

    const secretKey = envConfig.JWT_SECRET_FORGOT_PASSWORD_TOKEN
    const forgotPasswordToken = await createForgotPasswordToken({
      payload: {
        userId: foundUser._id.toString(),
        email: foundUser.email,
        role: foundUser.role,
        type: 'forgot-password'
      },
      secretKey
    })

    try {
      await sendForgotPasswordEmail(foundUser.email, forgotPasswordToken as string)
    } catch (error) {
      console.error(error)
      throw new BadRequestError('Gửi email thất bại, vui lòng thử lại.')
    }

    await UserModel.updateOne(
      { _id: foundUser._id },
      {
        $set: { forgotPasswordToken: forgotPasswordToken as string },
        $currentDate: { updatedAt: true }
      }
    )

    return { email: foundUser.email, forgotPasswordToken }
  }

  static verifyForgotPassword = async (payload: verifyForgotPasswordReqBodyType) => {
    const parseResult = await verifyForgotPasswordSchema.body.safeParseAsync(payload)
    if (!parseResult.success) {
      throw new BadRequestError('Invalid verification data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors))
    }
    const validatedData = parseResult.data
    const decode = await verifyToken(validatedData.forgotPasswordToken, envConfig.JWT_SECRET_FORGOT_PASSWORD_TOKEN)
    if (!decode) throw new BadRequestError('forgot_token decode fail')

    const foundUser = await UserModel.findById(decode.userId)
    if (!foundUser) throw new NotFoundError('User not found')
    return decode
  }

  static resetPassword = async (payload: resetPasswordReqBodyType) => {
    const parseResult = await resetPasswordSchema.body.safeParseAsync(payload)
    if (!parseResult.success) {
      throw new BadRequestError(
        'Invalid reset password data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors)
      )
    }
    const validatedData = parseResult.data

    const decode = await verifyToken(validatedData.forgotPasswordToken, envConfig.JWT_SECRET_FORGOT_PASSWORD_TOKEN)
    if (!decode) throw new BadRequestError('forgot_token decode fail')

    const foundUser = await UserModel.findById(decode.userId)
    if (!foundUser) throw new NotFoundError('User not found')
    if (foundUser.forgotPasswordToken !== validatedData.forgotPasswordToken)
      throw new BadRequestError(
        'Vui lòng yêu cầu lại email để đặt lại mật khẩu.Link đặt lại mật khẩu không còn hiệu lực hoặc đã được sử dụng.'
      )

    const passwordHash = bcrypt.hashSync(validatedData.password, 10)
    const result = await UserModel.findByIdAndUpdate(
      foundUser._id,
      {
        $set: {
          password: passwordHash,
          forgotPasswordToken: ''
        }
      },
      {
        new: true
      }
    )
    return {
      user: getInfoData({ fields: ['_id', 'name', 'email', 'phone', 'role'], object: result })
    }
  }

  static changePassword = async (userId: string | ObjectId, payload: changePasswordReqBodyType) => {
    const parseResult = await changePasswordSchema.body.safeParseAsync(payload)
    if (!parseResult.success) {
      throw new BadRequestError(
        'Invalid change password data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors)
      )
    }
    const validatedData = parseResult.data

    const foundUser = await UserModel.findById(userId)
    if (!foundUser) throw new NotFoundError('Not found user')

    const isPasswordMatch = await bcrypt.compare(validatedData.password, foundUser.password)
    if (!isPasswordMatch) throw new BadRequestError('Password is not match')

    const passwordHash = bcrypt.hashSync(validatedData.newPassword, 10)
    const result = await UserModel.findByIdAndUpdate(foundUser._id, { $set: { password: passwordHash } }, { new: true })
    return getInfoData({ fields: ['_id', 'name', 'email', 'phone'], object: result })
  }
}

export default AuthService
