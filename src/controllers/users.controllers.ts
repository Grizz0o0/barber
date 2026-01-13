import { Request, Response } from 'express'
import UserService from '~/services/user.services'
import { SuccessResponse } from '~/responses/success.response'

class UsersController {
  static getAllUsers = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get all users success',
      metadata: await UserService.getAllUsers(req.query)
    }).send(res)
  }

  static getUserById = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get user success',
      metadata: await UserService.getUserById(req.params.id)
    }).send(res)
  }

  static updateMe = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Update user success',
      metadata: await UserService.updateMe(userId, req.body)
    }).send(res)
  }

  static deleteUser = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Delete user success',
      metadata: await UserService.deleteUser(req.params.id)
    }).send(res)
  }

  static getMe = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Get me success',
      metadata: await UserService.getUserById(userId)
    }).send(res)
  }
  static getBarbers = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get barbers success',
      metadata: await UserService.getBarbers()
    }).send(res)
  }

  static updateUser = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Update user success',
      metadata: await UserService.updateUser(req.params.id, req.body)
    }).send(res)
  }

  static createUser = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Create user success',
      metadata: await UserService.createUser(req.body)
    }).send(res)
  }
}

export default UsersController
