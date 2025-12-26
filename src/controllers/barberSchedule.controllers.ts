import { Request, Response } from 'express'
import BarberScheduleService from '~/services/barberSchedule.services'
import { SuccessResponse, Created } from '~/responses/success.response'

class BarberScheduleController {
  static createSchedule = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    const { role } = req.user!
    new Created({
      message: 'Create schedule success',
      metadata: await BarberScheduleService.createSchedule(userId, role, req.body)
    }).send(res)
  }

  static getAllSchedules = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get list schedules success',
      metadata: await BarberScheduleService.getAllSchedules(req.query)
    }).send(res)
  }

  static getScheduleById = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get schedule detail success',
      metadata: await BarberScheduleService.getScheduleById(req.params.id)
    }).send(res)
  }

  static updateSchedule = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    const { role } = req.user!
    new SuccessResponse({
      message: 'Update schedule success',
      metadata: await BarberScheduleService.updateSchedule(userId, role, req.params.id, req.body)
    }).send(res)
  }

  static deleteSchedule = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    const { role } = req.user!
    new SuccessResponse({
      message: 'Delete schedule success',
      metadata: await BarberScheduleService.deleteSchedule(userId, role, req.params.id)
    }).send(res)
  }
}

export default BarberScheduleController
