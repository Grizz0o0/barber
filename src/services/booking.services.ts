import BookingModel, { IBooking } from '~/models/booking.model'
import ServiceModel from '~/models/serviceItem.model'
import BarberScheduleModel from '~/models/barberSchedule.model'
import { NotFoundError, BadRequestError, ForbiddenError } from '~/responses/error.response'
import { createPagination } from '~/responses/success.response'
import { CreateBookingReqBody, UpdateBookingReqBody, GetBookingQuery } from '~/requestSchemas/booking.request'
import SocketService from '~/services/socket.services'
import { ObjectId } from 'mongodb'
import UserModel from '~/models/user.model'
import { UserRole } from '~/constants/user'
// import { sendBookingSuccessEmail } from '~/utils/email.utils'
import PromotionService from '~/services/promotion.services'
import NotificationService from '~/services/notification.services'
import { NotificationType } from '~/models/notification.model'
import { BookingStatus, PaymentStatus, SERVICE_PADDING_TIME } from '~/constants/booking'

class BookingService {
  static createBooking = async (userId: string | ObjectId, payload: CreateBookingReqBody) => {
    const { barber, service, startTime, notes, promotion, guestName, guestPhone } = payload
    const startDateTime = new Date(startTime)

    // 1. Determine Customer (User OR Guest)
    let customerId: string | ObjectId | undefined = undefined
    let customerUser: any = null

    if (guestName && guestPhone) {
      // Guest Booking
      customerId = undefined
    } else {
      // User Booking (either for self or for another user)
      customerId = payload.user || userId
      customerUser = await UserModel.findOne({ _id: customerId, isDeleted: false, isActive: true })
      if (!customerUser) throw new NotFoundError('User not found or inactive')
    }

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

    // 3.5 BARBER BLOCK / VIRTUAL BUFFER CHECK
    // Check if there is an overdue "Confirmed" booking that ended recently but wasn't marked Completed.
    // This prevents booking a barber who is likely still busy with the previous unfinished client.
    const now = new Date()
    // Validation time: Min(startDateTime, now).
    // The previous booking must have ended both "before we start" and "before now" to be considered an overdue blocker.
    const checkTime = startDateTime < now ? startDateTime : now

    const overdueBooking = await BookingModel.findOne({
      barber: barber,
      status: BookingStatus.Confirmed, // Still confirmed, not completed
      endTime: {
        $lte: checkTime
      },
      // Optimization: Only check bookings that ended reasonably recently (e.g. within last 2 hours).
      // If they forgot to close a booking from yesterday, we probably shouldn't block today's work indefinitely?
      // Let's check last 60 mins.
      startTime: { $gte: new Date(startDateTime.getTime() - 60 * 60 * 1000 * 2) },
      isDeleted: false
    }).sort({ endTime: -1 }) // Get the latest one

    if (overdueBooking) {
      // If we found one, it means the barber has a Confirmed booking that ended in the past
      // but hasn't been marked Completed.
      // Block the new booking to allow buffer.
      throw new BadRequestError(
        'Thợ đang có lịch hẹn trước đó chưa hoàn thành (Check-out). Vui lòng chờ thợ xác nhận xong.'
      )
    }

    // 4. Check overlaps
    // 4. Check overlaps with Buffer (Service Padding)
    // Use standard SERVICE_PADDING_TIME (10 mins) instead of hardcoded 5 mins
    const paddingTime = SERVICE_PADDING_TIME
    const bufferedEndTime = new Date(endDateTime.getTime() + paddingTime)

    // Check for any booking that overlaps with our [startTime, bufferedEndTime]
    const overlappingBooking = await BookingModel.findOne({
      barber,
      status: { $ne: BookingStatus.Cancelled },
      isDeleted: false,
      $or: [{ startTime: { $lt: bufferedEndTime }, endTime: { $gt: startDateTime } }]
    }).populate('user', 'name')

    if (overlappingBooking) {
      // Analyze the conflict type
      const isBufferConflict =
        overlappingBooking.startTime.getTime() >= endDateTime.getTime() &&
        overlappingBooking.startTime.getTime() < bufferedEndTime.getTime()

      if (isBufferConflict) {
        // This means we physically fit, but violate the padding rule before the NEXT booking
        const nextStartTime = overlappingBooking.startTime
        const timeGapMs = nextStartTime.getTime() - startDateTime.getTime()
        const timeGapMinutes = Math.floor(timeGapMs / 60000)
        const requiredMinutes = foundService.duration + paddingTime / 60000

        throw new BadRequestError(
          `Không đủ thời gian! Thợ đang có lịch kế tiếp lúc ${nextStartTime.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          })}. Khoảng trống: ${timeGapMinutes} phút. Cần: ${requiredMinutes} phút (bao gồm ${paddingTime / 60000}p dọn dẹp).`
        )
      } else {
        // Direct overlap
        // If it's the booking AFTER us causing direct overlap
        if (overlappingBooking.startTime.getTime() > startDateTime.getTime()) {
          const nextStartTime = overlappingBooking.startTime
          const timeGapMs = nextStartTime.getTime() - startDateTime.getTime()
          const timeGapMinutes = Math.max(0, Math.floor(timeGapMs / 60000))
          const requiredMinutes = foundService.duration + paddingTime / 60000

          throw new BadRequestError(
            `Không đủ thời gian! Thợ đang có lịch kế tiếp lúc ${nextStartTime.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit'
            })}. Khoảng trống: ${timeGapMinutes} phút. Cần: ${requiredMinutes} phút.`
          )
        }

        // Standard busy message for other overlaps (e.g. completely inside another booking)
        throw new BadRequestError('Thợ đang bận trong khoảng thời gian này.')
      }
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

    const { source = 'online' } = payload

    const newBooking = await BookingModel.create({
      user: customerId,
      guestName,
      guestPhone,
      barber,
      service,
      startTime: startDateTime,
      endTime: endDateTime,
      notes,
      source,
      promotion: promotionId,
      discountAmount,
      totalPrice: finalPrice,
      status: BookingStatus.Pending,
      paymentStatus: PaymentStatus.Unpaid
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
      title: '📅 Lịch hẹn mới!',
      message: `Bạn có khách mới ${guestName || (customerUser ? customerUser.name : 'Khách hàng')} đặt lúc ${newBooking.startTime.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`,
      type: NotificationType.Booking,
      referenceId: newBooking._id
    }).catch(console.error)

    // Send Email (Async, don't block)
    // Send Email (Async, don't block) - Only if registered user
    // if (customerUser) {
    //   sendBookingSuccessEmail(customerUser.email, newBooking).catch(console.error)
    // }

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
    if (userRole === UserRole.Customer && foundBooking.user?.toString() !== userId.toString()) {
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
        const buffer = service.bufferTime || 0
        const endDateTime = new Date(startDateTime.getTime() + (service.duration + buffer) * 60000)

        // Validate Schedule
        const barberId = payload.barber || foundBooking.barber
        await BookingService.validateBarberSchedule(new ObjectId(barberId), startDateTime, endDateTime)

        // Check overlap (exclude current booking)
        const overlapping = await BookingModel.findOne({
          _id: { $ne: bookingId },
          barber: barberId,
          status: { $ne: BookingStatus.Cancelled },
          isDeleted: false,
          $or: [{ startTime: { $lt: endDateTime }, endTime: { $gt: startDateTime } }]
        })

        if (overlapping) {
          const nextStartTime = overlapping.startTime
          const timeGapMs = nextStartTime.getTime() - startDateTime.getTime()
          const timeGapMinutes = Math.max(0, Math.floor(timeGapMs / 60000))
          const requiredMinutes = service.duration + buffer

          if (overlapping.startTime > startDateTime) {
            throw new BadRequestError(
              `Không đủ thời gian! Thợ vướng lịch tiếp theo lúc ${nextStartTime.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })}. Trống ${timeGapMinutes}p. Cần ${requiredMinutes}p.`
            )
          }

          throw new BadRequestError('Thợ đang bận trong khoảng thời gian này.')
        }

        // Update payload
        // We use a separate update object to avoid mutating readonly payload and avoid TS errors
        const updateData: any = {
          ...payload,
          endTime: endDateTime
        }

        const updatedBooking = await BookingModel.findByIdAndUpdate(bookingId, updateData, { new: true })
        if (!updatedBooking) throw new BadRequestError('Update booking failed')

        return updatedBooking
      }
    }

    const updatedBooking = await BookingModel.findByIdAndUpdate(bookingId, payload, { new: true })
    if (!updatedBooking) throw new BadRequestError('Update booking failed')

    // DELAY WARNING & NOTIFICATION LOGIC
    // If Admin marks booking as COMPLETED and it is seemingly overtime
    // We check if it affects the next slot
    if (payload.status === BookingStatus.Completed) {
      const now = new Date()
      const endTime = new Date(updatedBooking.endTime)

      // If completed LATER than expected endTime
      if (now > endTime) {
        const delayMs = now.getTime() - endTime.getTime()
        const delayMinutes = Math.ceil(delayMs / 60000)

        // Only care if delay is significant (e.g. > 5 mins)
        if (delayMinutes >= 5) {
          // Find next booking for this barber
          const nextBooking = await BookingModel.findOne({
            barber: updatedBooking.barber,
            status: BookingStatus.Confirmed,
            isDeleted: false,
            startTime: { $gte: now }
          })
            .sort({ startTime: 1 })
            .populate('user')

          if (nextBooking) {
            const nextStartTime = new Date(nextBooking.startTime)
            // Check if the delay eats into the next booking's padded start
            // Actually, if we are finishing NOW, and next booking starts SOON.
            // If nextBooking.startTime is < now + padding, then the barber has < padding time to rest.
            // Or if nextBooking.startTime < now, they are already late.
            // Let's warn if nextBooking starts within (now + SERVICE_PADDING_TIME)

            const impactThreshold = new Date(now.getTime() + SERVICE_PADDING_TIME)

            if (nextStartTime < impactThreshold) {
              const waitMinutes =
                Math.ceil((now.getTime() - nextStartTime.getTime()) / 60000) + Math.ceil(SERVICE_PADDING_TIME / 60000)
              // Message logic: "Sorry, barber is finishing up previous client late."

              const message = `Thợ đang hoàn tất khách trước muộn hơn dự kiến. Có thể sẽ trễ khoảng ${delayMinutes} phút so với giờ hẹn của bạn. Mong bạn thông cảm!`

              // Send notification to NEXT customer
              // @ts-ignore
              if (nextBooking.user) {
                NotificationService.pushNotification({
                  // @ts-ignore
                  userId: nextBooking.user._id || nextBooking.user,
                  title: 'Thông báo trễ giờ (Delay Warning)',
                  message,
                  type: NotificationType.Booking, // Or add new Type if defined
                  referenceId: nextBooking._id
                }).catch(console.error)
              }
            }
          }
        }
      }
    }

    // Emit socket event
    SocketService.getInstance().emit('booking:updated', updatedBooking)

    // Notify User if status changed to confirmed/cancelled/completed
    if (payload.status && payload.status !== foundBooking.status) {
      const formattedTime = new Date(updatedBooking.startTime).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      })
      let title = 'Thông báo lịch hẹn'
      let message = ''

      if (payload.status === BookingStatus.Confirmed) {
        title = '✅ Đã xác nhận lịch hẹn'
        message = `Lịch hẹn lúc ${formattedTime} của bạn đã được xác nhận. Hẹn gặp bạn nhé!`
      }
      if (payload.status === BookingStatus.Cancelled) {
        title = '❌ Lịch hẹn bị hủy'
        message = `Lịch hẹn lúc ${formattedTime} đã bị hủy. Rất tiếc vì sự bất tiện này.`
      }
      if (payload.status === BookingStatus.Completed) {
        title = '🎉 Dịch vụ hoàn tất'
        message = 'Cảm ơn bạn đã ghé thăm! Hãy dành chút thời gian đánh giá dịch vụ nhé.'
      }

      if (message && updatedBooking.user) {
        NotificationService.pushNotification({
          userId: updatedBooking.user,
          title,
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
    if (userRole === UserRole.Customer && foundBooking.user?.toString() !== userId.toString()) {
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
    // 1. Convert Booking Time to Vietnam Time to get the correct Day of Week
    // using "en-US" ensures Sunday is 0, Monday is 1, matching getDay()
    const vnTimeZone = 'Asia/Ho_Chi_Minh'
    const vnDateString = startDateTime.toLocaleString('en-US', { timeZone: vnTimeZone })
    const vnDate = new Date(vnDateString)
    const dayOfWeek = vnDate.getDay() // 0-6 in VN time

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

    // 2. Validate Time Range
    // BarberSchedule stores simple strings "HH:mm" (e.g. "09:00") assuming Local Time (VN).
    // We need to convert the Booking's specific UTC instants to Local "HH:mm" strings to compare.

    // Format: "HH:mm" (24-hour format)
    // en-GB uses HH:mm:ss by default, we slice the first 5 chars
    const bookingStartStr = startDateTime
      .toLocaleTimeString('en-GB', { timeZone: vnTimeZone, hour12: false })
      .slice(0, 5)
    const bookingEndStr = endDateTime.toLocaleTimeString('en-GB', { timeZone: vnTimeZone, hour12: false }).slice(0, 5)

    // String comparison works for "HH:mm" format (e.g. "09:00" <= "09:30")
    if (bookingStartStr < barberSchedule.startTime || bookingEndStr > barberSchedule.endTime) {
      throw new BadRequestError('Booking time is outside of barber working hours')
    }
  }
  static handleEmergency = async ({
    barberId,
    date,
    action,
    targetBarberId
  }: {
    barberId: string
    date: string
    action: 'cancel' | 'move'
    targetBarberId?: string
  }) => {
    // 1. Find bookings for that barber on that day (Pending/Confirmed only)
    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const bookings = await BookingModel.find({
      barber: barberId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: [BookingStatus.Pending, BookingStatus.Confirmed] },
      isDeleted: false
    })
    if (bookings.length === 0) {
      return { message: 'No active bookings found for this day.', processed: 0, failed: [] }
    }

    if (action === 'cancel') {
      // Bulk Cancel
      const ids = bookings.map((b) => b._id)
      await BookingModel.updateMany(
        { _id: { $in: ids } },
        { status: BookingStatus.Cancelled, notes: 'Cancelled due to staff emergency' }
      )

      // Notify users
      bookings.forEach((booking) => {
        if (booking.user) {
          NotificationService.pushNotification({
            userId: booking.user,
            title: 'Lịch hẹn bị hủy',
            message: `Chúng tôi rất tiếc phải thông báo lịch hẹn của bạn lúc ${new Date(
              booking.startTime
            ).toLocaleTimeString()} bị hủy do thợ có việc đột xuất. Vui lòng đặt lại lịch khác.`,
            type: NotificationType.Booking,
            referenceId: booking._id
          }).catch(console.error)
        }
      })

      return { processed: bookings.length, failed: [], message: `Cancelled ${bookings.length} bookings.` }
    } else if (action === 'move') {
      if (!targetBarberId) throw new BadRequestError('Target barber is required for move action')
      // targetUser verification ...
      const targetUser = await UserModel.findById(targetBarberId)
      if (!targetUser) throw new NotFoundError('Target barber not found')

      const successIds: string[] = []
      const failedBookings: any[] = []

      // This is "Best Effort". We check if targetBarber is free for EACH booking slot.
      for (const booking of bookings) {
        try {
          // Check standard availability for target barber at this specific time
          // Re-use logic or duplicate simple check?
          // Simple check: overlaps?
          const start = new Date(booking.startTime)
          const end = new Date(booking.endTime) // Assumes endTime is correct in DB

          // Check target barber schedule (working hours)
          await BookingService.validateBarberSchedule(new ObjectId(targetBarberId), start, end)

          // Check overlap
          const overlap = await BookingModel.findOne({
            barber: targetBarberId,
            status: { $ne: BookingStatus.Cancelled },
            isDeleted: false,
            $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }]
          })

          if (overlap) {
            failedBookings.push({ booking, reason: 'Target barber busy' })
          } else {
            // Move it
            // Update barber
            await BookingModel.findByIdAndUpdate(booking._id, {
              barber: targetBarberId,
              notes: (booking.notes || '') + ' [Moved due to emergency]'
            })
            successIds.push(booking._id.toString())

            // Notify
            if (booking.user) {
              NotificationService.pushNotification({
                userId: booking.user,
                title: 'Thay đổi thợ cắt tóc',
                message: `Lịch hẹn lúc ${start.toLocaleTimeString()} của bạn được chuyển sang thợ ${
                  targetUser.name
                } do thợ cũ có việc đột xuất.`,
                type: NotificationType.Booking,
                referenceId: booking._id
              }).catch(console.error)
            }
          }
        } catch (err: any) {
          failedBookings.push({ booking, reason: err.message || 'Validation failed' })
        }
      }

      return {
        processed: successIds.length,
        failed: failedBookings,
        message: `Moved ${successIds.length} bookings. Failed: ${failedBookings.length}.`
      }
    }
  }
}

export default BookingService
