import BarberScheduleModel from '~/models/barberSchedule.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { createPagination } from '~/responses/success.response'
import {
  CreateBarberScheduleReqBody,
  UpdateBarberScheduleReqBody,
  GetBarberScheduleQuery
} from '~/requestSchemas/barberSchedule.request'
import SocketService from '~/services/socket.services'
import { UserRole } from '~/constants/user'
import { ObjectId } from 'mongodb'

class BarberScheduleService {
  static createSchedule = async (userId: string | ObjectId, role: string, payload: CreateBarberScheduleReqBody) => {
    if (role === UserRole.Barber) {
      payload.barber = userId.toString()
    }
    const { barber, dayOfWeek, startTime, endTime } = payload

    // Validation: Start time < End time
    if (startTime >= endTime) {
      throw new BadRequestError('Giờ kết thúc phải sau giờ bắt đầu')
    }

    // Check for duplicate schedule for the same barber on the same day
    const existingSchedule = await BarberScheduleModel.findOne({
      barber,
      dayOfWeek,
      isDeleted: false
    })

    if (existingSchedule) {
      throw new BadRequestError('Barber này đã có lịch cho ngày này')
    }

    const newSchedule = await BarberScheduleModel.create(payload)
    if (!newSchedule) throw new BadRequestError('Error create barber schedule')

    // Emit socket event
    SocketService.getInstance().emit('barber_schedule:created', newSchedule)

    return newSchedule
  }

  static getAllSchedules = async ({
    limit = 10,
    page = 1,
    order = 'asc',
    sortBy = 'dayOfWeek',
    barber,
    dayOfWeek
  }: GetBarberScheduleQuery) => {
    const skip = ((page || 1) - 1) * (limit || 10)
    const sortOrder = order === 'asc' ? 1 : -1
    const sortCondition: { [key: string]: 1 | -1 } = { [sortBy || 'dayOfWeek']: sortOrder }

    const filter: any = { isDeleted: false }

    if (barber) {
      filter.barber = barber
    }

    if (dayOfWeek !== undefined) {
      filter.dayOfWeek = dayOfWeek
    }

    const totalItems = await BarberScheduleModel.countDocuments(filter)

    const schedules = await BarberScheduleModel.find(filter)
      .sort(sortCondition)
      .skip(skip)
      .limit(limit || 10)
      .lean()

    const pagination = createPagination(page || 1, limit || 10, totalItems)

    return { schedules, pagination }
  }

  static getScheduleById = async (scheduleId: string) => {
    const foundSchedule = await BarberScheduleModel.findOne({ _id: scheduleId, isDeleted: false })
    if (!foundSchedule) throw new NotFoundError('Schedule not found')
    return foundSchedule
  }

  static updateSchedule = async (
    userId: string | ObjectId,
    role: string,
    scheduleId: string,
    payload: UpdateBarberScheduleReqBody
  ) => {
    const foundSchedule = await BarberScheduleModel.findOne({ _id: scheduleId, isDeleted: false })
    if (!foundSchedule) throw new NotFoundError('Schedule not found')

    if (role === UserRole.Barber && foundSchedule.barber.toString() !== userId.toString()) {
      throw new BadRequestError('Bạn không có quyền sửa lịch của barber khác')
    }

    if (payload.startTime && payload.endTime && payload.startTime >= payload.endTime) {
      throw new BadRequestError('Giờ kết thúc phải sau giờ bắt đầu')
    }

    // Also check if partial updates invalidate the time range (e.g. updating startTime > existing endTime)
    const startTime = payload.startTime || foundSchedule.startTime
    const endTime = payload.endTime || foundSchedule.endTime

    if (startTime >= endTime) {
      throw new BadRequestError('Giờ kết thúc phải sau giờ bắt đầu')
    }

    const updatedSchedule = await BarberScheduleModel.findByIdAndUpdate(scheduleId, payload, { new: true })
    if (!updatedSchedule) throw new BadRequestError('Update schedule failed')

    // Emit socket event
    SocketService.getInstance().emit('barber_schedule:updated', updatedSchedule)

    return updatedSchedule
  }

  static deleteSchedule = async (userId: string | ObjectId, role: string, scheduleId: string) => {
    const foundSchedule = await BarberScheduleModel.findOne({ _id: scheduleId, isDeleted: false })
    if (!foundSchedule) throw new NotFoundError('Schedule not found')

    if (role === UserRole.Barber && foundSchedule.barber.toString() !== userId.toString()) {
      throw new BadRequestError('Bạn không có quyền xóa lịch của barber khác')
    }

    // Soft delete
    const deletedSchedule = await BarberScheduleModel.findByIdAndUpdate(
      scheduleId,
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
      { new: true }
    )

    if (!deletedSchedule) throw new BadRequestError('Delete schedule failed')

    // Emit socket event
    SocketService.getInstance().emit('barber_schedule:deleted', deletedSchedule)

    return deletedSchedule
  }
}

export default BarberScheduleService
