import { Request, Response } from 'express'
import AuthService from '~/services/auth.services'
import { Created, SuccessResponse } from '~/responses/success.response'
import envConfig from '~/config/env.config'

class AuthController {
  static register = async (req: Request, res: Response) => {
    new Created({
      message: 'Register success',
      metadata: await AuthService.register(req.body)
    }).send(res)
  }

  static login = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Login success',
      metadata: await AuthService.login(req.body)
    }).send(res)
  }

  static logout = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Logout success',
      metadata: await AuthService.logout(req.keyStore!)
    }).send(res)
  }

  static refreshToken = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Refresh token success',
      metadata: await AuthService.handlerRefreshToken(req.refreshToken!)
    }).send(res)
  }

  // static verifyEmail = async (req: Request, res: Response) => {
  //   new SuccessResponse({
  //     message: 'Verify email success',
  //     metadata: await AuthService.verifyEmail(req.body)
  //   }).send(res)
  // }

  // static resendVerifyEmail = async (req: Request, res: Response) => {
  //   new SuccessResponse({
  //     message: 'Resend verify email success',
  //     metadata: await AuthService.resendVerifyEmail(req.body)
  //   }).send(res)
  // }

  static forgotPassword = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Forgot password success',
      metadata: await AuthService.forgotPassword(req.body)
    }).send(res)
  }

  static verifyForgotPassword = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Verify forgot password success',
      metadata: await AuthService.verifyForgotPassword(req.body)
    }).send(res)
  }

  static resetPassword = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Reset password success',
      metadata: await AuthService.resetPassword(req.body)
    }).send(res)
  }

  static changePassword = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Change password success',
      metadata: await AuthService.changePassword(userId, req.body)
    }).send(res)
  }

  static oAuthGoogle = async (req: Request, res: Response) => {
    const { code } = req.query
    const result = await AuthService.oAuthGoogle(code as string)
    const { accessToken, refreshToken, userId } = result
    return res.redirect(
      `${envConfig.CLIENT_URL}/oauth/google?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${userId}`
    )
  }
}

export default AuthController
