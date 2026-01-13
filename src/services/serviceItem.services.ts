import ServiceItemModel from '~/models/serviceItem.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { createPagination } from '~/responses/success.response'
import {
  CreateServiceItemReqBody,
  UpdateServiceItemReqBody,
  GetListServiceItemQuery
} from '~/requestSchemas/serviceItem.request'
import { ObjectId } from 'mongodb'
import BookingModel from '~/models/booking.model'
import { BookingStatus } from '~/constants/booking'

class ServiceItemService {
  static createServiceItem = async (payload: CreateServiceItemReqBody) => {
    const newService = await ServiceItemModel.create(payload)
    if (!newService) throw new BadRequestError('Error create service')
    return newService
  }

  static getAllServiceItems = async ({
    limit = 10,
    page = 1,
    order = 'desc',
    sortBy = 'createdAt',
    search,
    isActive
  }: GetListServiceItemQuery) => {
    const skip = ((page || 1) - 1) * (limit || 10)
    const sortOrder = order === 'asc' ? 1 : -1
    const sortCondition: { [key: string]: 1 | -1 } = { [sortBy || 'createdAt']: sortOrder }

    const filter: any = { isDeleted: false }

    if (isActive) {
      filter.isActive = isActive === 'true'
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }

    const totalItems = await ServiceItemModel.countDocuments(filter)

    const services = await ServiceItemModel.find(filter)
      .sort(sortCondition)
      .skip(skip)
      .limit(limit || 10)
      .lean()

    const pagination = createPagination(page || 1, limit || 10, totalItems)

    return { services, pagination }
  }

  static getServiceItemById = async (serviceId: string) => {
    const foundService = await ServiceItemModel.findOne({ _id: serviceId, isDeleted: false })
    if (!foundService) throw new NotFoundError('Service not found')
    return foundService
  }

  static updateServiceItem = async (serviceId: string, payload: UpdateServiceItemReqBody) => {
    const foundService = await ServiceItemModel.findOne({ _id: serviceId, isDeleted: false })
    if (!foundService) throw new NotFoundError('Service not found')

    const updatedService = await ServiceItemModel.findByIdAndUpdate(serviceId, payload, { new: true })
    if (!updatedService) throw new BadRequestError('Update service failed')

    return updatedService
  }

  static deleteServiceItem = async (serviceId: string, userId: string | ObjectId) => {
    const foundService = await ServiceItemModel.findOne({ _id: serviceId, isDeleted: false })
    if (!foundService) throw new NotFoundError('Service not found')

    // 1. Check for active future bookings
    const hasActiveBookings = await BookingModel.findOne({
      service: serviceId,
      status: { $in: [BookingStatus.Pending, BookingStatus.Confirmed] },
      startTime: { $gte: new Date() },
      isDeleted: false
    })

    if (hasActiveBookings) {
      throw new BadRequestError('Không thể xóa dịch vụ vì còn lịch hẹn chưa hoàn thành trong tương lai')
    }

    // 2. Soft delete
    const deletedService = await ServiceItemModel.findByIdAndUpdate(
      serviceId,
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
      { new: true }
    )

    if (!deletedService) throw new BadRequestError('Delete service failed')

    return deletedService
  }
}

export default ServiceItemService
