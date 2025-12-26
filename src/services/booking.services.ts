import BookingModel from '~/models/booking.model'
import ServiceModel from '~/models/serviceItem.model'
import BarberScheduleModel from '~/models/barberSchedule.model'
import { NotFoundError, BadRequestError, ForbiddenError } from '~/responses/error.response'
import { createPagination } from '~/responses/success.response'
import { CreateBookingReqBody, UpdateBookingReqBody, GetBookingQuery } from '~/requestSchemas/booking.request'
import SocketService from '~/services/socket.services'
import { ObjectId } from 'mongodb'
import UserModel from '~/models/user.model'
import { UserRole } from '~/constants/user'
import { sendBookingSuccessEmail } from '~/utils/email.utils'
import PromotionService from '~/services/promotion.services'
import NotificationService from '~/services/notification.services'
import { NotificationType } from '~/models/notification.model'

class BookingService {
  static createBooking = async (userId: string | ObjectId, payload: CreateBookingReqBody) => {
    const { barber, service, startTime, notes, promotion } = payload
    const startDateTime = new Date(startTime)

    // 1. Check User and Barber existence
    const user = await UserModel.findOne({ _id: userId, isDeleted: false, isActive: true })
    if (!user) throw new NotFoundError('User not found or inactive')

    const barberUser = await UserModel.findOne({ _id: barber, isDeleted: false, isActive: true })
    if (!barberUser) throw new NotFoundError('Barber user not found')

    if (barberUser.role !== UserRole.Barber) {
      throw new BadRequestError('Selected user is not a barber')
    }

    // 2. Check Service existence and get duration/price
    const foundService = await ServiceModel.findOne({ _id: service, isDeleted: false })
    if (!foundService) throw new NotFoundError('Service not found')

    // 2. Calculate endTime based on service duration
    const endDateTime = new Date(startDateTime.getTime() + foundService.duration * 60000)

    // 3. Check Barber Schedule
    await BookingService.validateBarberSchedule(new ObjectId(barber), startDateTime, endDateTime)

    // 4. Check overlaps
    const overlappingBooking = await BookingModel.findOne({
      barber,
      status: { $ne: 'cancelled' },
      isDeleted: false,
      $or: [{ startTime: { $lt: endDateTime }, endTime: { $gt: startDateTime } }]
    })

    if (overlappingBooking) {
      throw new BadRequestError('Barber is busy at this time')
    }

    // 4.5 Apply Promotion
    let finalPrice = foundService.price
    let discountAmount = 0
    let promotionId: string | ObjectId | undefined

    if (promotion) {
      const checkPromo = await PromotionService.verifyPromotion(promotion, foundService.price, 'service')
      if (!checkPromo.isValid) {
        throw new BadRequestError(checkPromo.message || 'Promotion invalid')
      }
      discountAmount = checkPromo.discountAmount
      finalPrice = foundService.price - discountAmount
      promotionId = checkPromo.promotionId
    }

    const newBooking = await BookingModel.create({
      user: userId,
      barber,
      service,
      startTime: startDateTime,
      endTime: endDateTime,
      notes,
      promotion: promotionId,
      discountAmount,
      totalPrice: finalPrice,
      status: 'pending',
      paymentStatus: 'unpaid'
    })

    if (!newBooking) throw new BadRequestError('Error create booking')

    // 4.6 Increment Promotion Usage
    if (promotionId) {
      PromotionService.incrementUsage(promotionId).catch(console.error)
    }

    // Emit socket event
    SocketService.getInstance().emit('booking:created', newBooking)

    // Push Notification to Barber
    NotificationService.pushNotification({
      userId: barber,
      title: 'Lịch hẹn mới',
      message: `Khách hàng đã đặt lịch hẹn lúc ${newBooking.startTime.toLocaleString()}`,
      type: NotificationType.Booking,
      referenceId: newBooking._id
    }).catch(console.error)

    // Send Email (Async, don't block)
    sendBookingSuccessEmail(user.email, newBooking).catch(console.error)

    return newBooking
  }

  static getAllBookings = async ({
    limit = 10,
    page = 1,
    order = 'desc',
    sortBy = 'createdAt',
    barber,
    user,
    status,
    from,
    to
  }: GetBookingQuery) => {
    const skip = ((page || 1) - 1) * (limit || 10)
    const sortOrder = order === 'asc' ? 1 : -1
    const sortCondition: { [key: string]: 1 | -1 } = { [sortBy || 'createdAt']: sortOrder }

    const filter: any = { isDeleted: false }

    if (barber) filter.barber = barber
    if (user) filter.user = user
    if (status) filter.status = status

    if (from || to) {
      filter.startTime = {}
      if (from) filter.startTime.$gte = new Date(from)
      if (to) filter.startTime.$lte = new Date(to)
    }

    const totalItems = await BookingModel.countDocuments(filter)

    const bookings = await BookingModel.find(filter)
      .populate('user', 'name email phone avatar')
      .populate('barber', 'name email phone avatar') // Assuming barber is a User
      .populate('service', 'name price duration')
      .sort(sortCondition)
      .skip(skip)
      .limit(limit || 10)
      .lean()

    const pagination = createPagination(page || 1, limit || 10, totalItems)

    return { bookings, pagination }
  }

  static getBookingById = async (bookingId: string) => {
    const foundBooking = await BookingModel.findOne({ _id: bookingId, isDeleted: false })
      .populate('user', 'name email phone avatar')
      .populate('barber', 'name email phone avatar')
      .populate('service', 'name price duration')

    if (!foundBooking) throw new NotFoundError('Booking not found')
    return foundBooking
  }

  static updateBooking = async (
    bookingId: string,
    userId: string | ObjectId,
    userRole: string,
    payload: UpdateBookingReqBody
  ) => {
    const foundBooking = await BookingModel.findOne({ _id: bookingId, isDeleted: false })
    if (!foundBooking) throw new NotFoundError('Booking not found')

    // Check ownership
    if (userRole === UserRole.Customer && foundBooking.user.toString() !== userId.toString()) {
      throw new ForbiddenError('You can only update your own bookings')
    }

    // If rescheduling (changing time/service/barber), we need to re-validate overlaps
    if (payload.startTime || payload.service || payload.barber) {
      // Logic to recalculate times and check overlaps...
      // For simplicity in this CRUD step, let's allow updating direct fields first.
      // But if startTime changes, we must recalc endTime if service is constant, or look up service duration.
      // This complexity suggests we might block rescheduling here or handle it carefully.
      // Let's implement basic status updates first. If conflict checks are needed for update, add them.

      if (payload.startTime || payload.service) {
        // Recalc endTime
        const startDateTime = payload.startTime ? new Date(payload.startTime) : foundBooking.startTime
        const serviceId = payload.service || foundBooking.service

        const service = await ServiceModel.findById(serviceId)
        if (!service) throw new BadRequestError('Service not found')

        // Recalc end time
        const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000)

        // Validate Schedule
        const barberId = payload.barber || foundBooking.barber
        await BookingService.validateBarberSchedule(new ObjectId(barberId), startDateTime, endDateTime)

        // Check overlap (exclude current booking)

        const overlapping = await BookingModel.findOne({
          _id: { $ne: bookingId },
          barber: barberId,
          status: { $ne: 'cancelled' },
          isDeleted: false,
          $or: [{ startTime: { $lt: endDateTime }, endTime: { $gt: startDateTime } }]
        })

        if (overlapping) throw new BadRequestError('Barber is busy at this time')

        // Update payload
        // @ts-ignore
        payload.endTime = endDateTime
      }
    }

    const updatedBooking = await BookingModel.findByIdAndUpdate(bookingId, payload, { new: true })
    if (!updatedBooking) throw new BadRequestError('Update booking failed')

    // Emit socket event
    SocketService.getInstance().emit('booking:updated', updatedBooking)

    // Notify User if status changed to confirmed/cancelled/completed
    if (payload.status && payload.status !== foundBooking.status) {
      let message = ''
      if (payload.status === 'confirmed') message = 'Lịch hẹn của bạn đã được xác nhận'
      if (payload.status === 'cancelled') message = 'Lịch hẹn của bạn đã bị hủy'
      if (payload.status === 'completed') message = 'Cảm ơn bạn đã sử dụng dịch vụ'

      if (message) {
        NotificationService.pushNotification({
          userId: updatedBooking.user,
          title: 'Cập nhật lịch hẹn',
          message,
          type: NotificationType.Booking,
          referenceId: updatedBooking._id
        }).catch(console.error)
      }
    }

    return updatedBooking
  }

  static deleteBooking = async (bookingId: string, userId: string | ObjectId, userRole: string) => {
    const foundBooking = await BookingModel.findOne({ _id: bookingId, isDeleted: false })
    if (!foundBooking) throw new NotFoundError('Booking not found')

    // Check ownership
    if (userRole === UserRole.Customer && foundBooking.user.toString() !== userId.toString()) {
      throw new ForbiddenError('You can only delete your own bookings')
    }

    // Soft delete
    const deletedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
      { new: true }
    )

    if (!deletedBooking) throw new BadRequestError('Delete booking failed')

    // Emit socket event
    SocketService.getInstance().emit('booking:deleted', deletedBooking)

    return deletedBooking
  }

  static validateBarberSchedule = async (barberId: ObjectId, startDateTime: Date, endDateTime: Date) => {
    const dayOfWeek = startDateTime.getDay()
    const barberSchedule = await BarberScheduleModel.findOne({
      barber: barberId,
      dayOfWeek,
      isDeleted: false
    })

    if (!barberSchedule) {
      throw new BadRequestError('Barber does not work on this day')
    }

    if (barberSchedule.isDayOff) {
      throw new BadRequestError('Barber is off on this day')
    }

    // Standardize to UTC: We assume BarberSchedule start/end times are stored in UTC (HH:MM)
    // and the incoming startDateTime is a proper ISO 8601 Date object.
    const [startHour, startMinute] = barberSchedule.startTime.split(':').map(Number)
    const [endHour, endMinute] = barberSchedule.endTime.split(':').map(Number)

    const scheduleStart = new Date(startDateTime)
    scheduleStart.setUTCHours(startHour, startMinute, 0, 0)

    const scheduleEnd = new Date(startDateTime)
    scheduleEnd.setUTCHours(endHour, endMinute, 0, 0)

    // Note: If scheduleEnd is meant to be the next day (e.g. 23:00 to 02:00), logic needs generic day-crossing handling.
    // Assuming strictly within-day schedules for Barber for now or stored as UTC covering the shift.

    if (startDateTime < scheduleStart || endDateTime > scheduleEnd) {
      throw new BadRequestError('Booking time is outside of barber working hours (UTC)')
    }
  }
}

export default BookingService
