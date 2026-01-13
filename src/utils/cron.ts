import cron from 'node-cron'
import Booking from '../models/booking.model'
import { BookingStatus } from '../constants/booking'
import Notification, { NotificationType } from '../models/notification.model'

// Run every 5 minutes
export const startCronJobs = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date()
      // 15 minutes ago
      const thresholdTime = new Date(now.getTime() - 15 * 60000)

      // Find bookings that are 'confirmed' AND have startTime BEFORE thresholdTime
      const lateBookings = await Booking.find({
        status: BookingStatus.Confirmed,
        startTime: { $lt: thresholdTime }
      })

      if (lateBookings.length > 0) {
        console.log(`[CRON] Found ${lateBookings.length} late bookings. Marking as NO_SHOW.`)

        for (const booking of lateBookings) {
          booking.status = BookingStatus.NoShow as any // Cast if enum types aren't fully synced yet
          await booking.save()

          // Optional: Create notification for the user (or admin)
          // "Bạn đã lỡ hẹn. Vui lòng liên hệ để đặt lại."
          await Notification.create({
            user: booking.user,
            title: 'Lịch hẹn bị hủy (Vắng mặt)',
            message: 'Bạn đã không đến đúng giờ hẹn. Hệ thống đã huỷ lịch. Vui lòng đặt lại nếu cần.',
            type: NotificationType.Booking, // Assuming this exists or works with 'Booking' string
            referenceId: booking._id,
            isRead: false
          })
        }
      }
    } catch (error) {
      console.error('[CRON] Error checking late bookings:', error)
    }
  })

  console.log('⏰ Cron jobs started: CheckLateBookings (every 5m)')
}
