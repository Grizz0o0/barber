import ServiceModel from '~/models/serviceItem.model'
import UserModel from '~/models/user.model'
import BookingService from '~/services/booking.services'
import { UserRole } from '~/constants/user'
import { BookingStatus } from '~/constants/booking'
import BookingModel from '~/models/booking.model'
import BarberScheduleModel from '~/models/barberSchedule.model'

export const tools = {
  checkAvailability: async ({ date, barberName }: { date: string; barberName?: string }) => {
    try {
      const searchDate = new Date(date)
      const startOfDay = new Date(searchDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(searchDate)
      endOfDay.setHours(23, 59, 59, 999)

      // 1. Find Barbers
      let barbers = []
      if (barberName) {
        barbers = await UserModel.find({
          role: UserRole.Barber,
          name: { $regex: new RegExp(barberName, 'i') },
          isActive: true
        })
      } else {
        barbers = await UserModel.find({ role: UserRole.Barber, isActive: true })
      }

      if (barbers.length === 0) return JSON.stringify({ message: 'Không tìm thấy thợ nào.' })

      // 2. Check Schedules & Bookings for each barber
      const availability = []

      for (const barber of barbers) {
        // Check schedule
        const dayOfWeek = searchDate.getDay()
        const schedule = await BarberScheduleModel.findOne({
          barber: barber._id,
          dayOfWeek,
          isDeleted: false,
          isDayOff: false
        })

        if (!schedule) continue

        // Get booked slots
        const bookings = await BookingModel.find({
          barber: barber._id,
          startTime: { $gte: startOfDay, $lte: endOfDay },
          status: { $ne: BookingStatus.Cancelled },
          isDeleted: false
        })

        availability.push({
          barber: barber.name,
          workingHours: `${schedule.startTime} - ${schedule.endTime}`,
          bookedSlots: bookings.map((b) => ({
            start: b.startTime.toTimeString().slice(0, 5),
            end: b.endTime.toTimeString().slice(0, 5)
          }))
        })
      }

      return JSON.stringify({
        date: date,
        availability
      })
    } catch (error: any) {
      return JSON.stringify({ error: error.message })
    }
  },

  createBooking: async ({
    customerName,
    customerPhone,
    date,
    serviceName,
    barberName,
    userId
  }: {
    customerName: string
    customerPhone: string
    date: string
    serviceName: string
    barberName: string
    userId?: string
  }) => {
    try {
      // 1. Resolve Barber
      const barber = await UserModel.findOne({
        role: UserRole.Barber,
        name: { $regex: new RegExp(barberName, 'i') }
      })
      if (!barber) return JSON.stringify({ error: 'Không tìm thấy thợ này.' })

      // 2. Resolve Service
      const service = await ServiceModel.findOne({
        name: { $regex: new RegExp(serviceName, 'i') }
      })
      if (!service) return JSON.stringify({ error: 'Không tìm thấy dịch vụ này.' })

      // 3. Create Booking
      const bookingPayload: any = {
        barber: barber._id.toString(),
        service: service._id.toString(),
        startTime: new Date(date), // Standard input format ISO string
        notes: 'Booking via AI Chat',
        guestName: customerName,
        guestPhone: customerPhone
      }

      if (userId) {
        bookingPayload.user = userId
      }

      const booking = await BookingService.createBooking(userId || 'guest', bookingPayload)

      return JSON.stringify({
        message: 'Đặt lịch thành công!',
        bookingId: booking._id,
        details: {
          barber: barber.name,
          service: service.name,
          time: booking.startTime
        }
      })
    } catch (error: any) {
      return JSON.stringify({ error: error.message })
    }
  },

  getServices: async () => {
    const services = await ServiceModel.find({ isDeleted: false }).select('name price duration')
    return JSON.stringify(services)
  }
}
