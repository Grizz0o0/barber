import { Request, Response, NextFunction } from 'express'
import { SuccessResponse } from '~/responses/success.response'
import Order from '~/models/order.model'
import Booking from '~/models/booking.model'
import User from '~/models/user.model'
import Service from '~/models/serviceItem.model'
import { UserRole } from '~/constants/user'
import { BookingStatus } from '~/constants/booking'

class StatisticsController {
  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    const { period = 'month' } = req.query as { period?: string }

    const now = new Date()
    let startDate = new Date()
    let groupByFormat = '%Y-%m-%d'

    // Determine startDate based on period
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1)
      groupByFormat = '%Y-%m' // Group by month for year view
    } else if (period === 'day') {
      // For "day", we want stats for TODAY (00:00 to 23:59)
      startDate = new Date(now.setHours(0, 0, 0, 0))
    } else {
      // default 30 days
      startDate.setDate(now.getDate() - 30)
    }

    // Previous period for growth calculation
    const previousStartDate = new Date(startDate)
    const previousEndDate = new Date(startDate)

    if (period === 'week') {
      previousStartDate.setDate(startDate.getDate() - 7)
    } else if (period === 'month') {
      previousStartDate.setMonth(startDate.getMonth() - 1)
    } else if (period === 'year') {
      previousStartDate.setFullYear(startDate.getFullYear() - 1)
    } else if (period === 'day') {
      previousStartDate.setDate(startDate.getDate() - 1)
    } else {
      previousStartDate.setDate(startDate.getDate() - 30)
    }

    const [
      revenueOrders,
      revenueBookings,
      totalBookings,
      newCustomers,
      topBarbers,
      serviceDist,
      recentBookings,
      prevRevenueOrders,
      prevRevenueBookings,
      prevTotalBookingsCount,
      prevNewCustomersCount
    ] = await Promise.all([
      // Revenue from Orders
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['delivered', 'shipped', 'processing'] } // Include active orders
          }
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      // Revenue from Bookings
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: [BookingStatus.Completed, BookingStatus.Confirmed] } // Include confirmed/completed
          }
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      // Total Bookings Count
      Booking.countDocuments({
        createdAt: { $gte: startDate },
        status: { $ne: 'cancelled' }
      }),
      // New Customers
      User.countDocuments({
        createdAt: { $gte: startDate },
        role: UserRole.Customer
      }),
      // Top Barbers (by revenue for the period)
      Booking.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
        {
          $group: {
            _id: '$barber',
            revenue: { $sum: '$totalPrice' },
            bookings: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'barberInfo' } },
        { $unwind: '$barberInfo' },
        { $project: { name: '$barberInfo.name', revenue: 1, bookings: 1 } }
      ]),
      // Service Distribution
      Booking.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
        {
          $group: {
            _id: '$service',
            value: { $sum: 1 }
          }
        },
        { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'serviceInfo' } },
        { $unwind: '$serviceInfo' },
        { $project: { name: '$serviceInfo.name', value: 1 } }
      ]),
      // Recent Bookings (for Overview) - Get latest 5
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name')
        .populate('barber', 'name')
        .populate('service', 'name')
        .lean(),
      // Previous Period Revenue (Orders)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: previousStartDate, $lt: startDate },
            status: { $in: ['delivered', 'shipped', 'processing'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      // Previous Period Revenue (Bookings)
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: previousStartDate, $lt: startDate },
            status: { $in: [BookingStatus.Completed, BookingStatus.Confirmed] }
          }
        }
      ]),
      // Previous Period Bookings Count
      Booking.countDocuments({
        createdAt: { $gte: previousStartDate, $lt: startDate },
        status: { $ne: 'cancelled' }
      }),
      // Previous Period New Customers
      User.countDocuments({
        createdAt: { $gte: previousStartDate, $lt: startDate },
        role: UserRole.Customer
      })
    ])

    const totalRevenue = (revenueOrders[0]?.total || 0) + (revenueBookings[0]?.total || 0)
    const prevTotalRevenue = (prevRevenueOrders[0]?.total || 0) + (prevRevenueBookings[0]?.total || 0)

    // Calculate growth percentage
    let growth = 0
    if (prevTotalRevenue > 0) {
      growth = Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100)
    } else if (totalRevenue > 0) {
      growth = 100
    }

    // Calculate bookings growth
    const prevTotalBookings = prevTotalBookingsCount
    let bookingsGrowth = 0
    if (prevTotalBookings > 0) {
      bookingsGrowth = Math.round(((totalBookings - prevTotalBookings) / prevTotalBookings) * 100)
    } else if (totalBookings > 0) {
      bookingsGrowth = 100
    }

    // Calculate new customers growth
    const prevNewCustomers = prevNewCustomersCount
    let newCustomersGrowth = 0
    if (prevNewCustomers > 0) {
      newCustomersGrowth = Math.round(((newCustomers - prevNewCustomers) / prevNewCustomers) * 100)
    } else if (newCustomers > 0) {
      newCustomersGrowth = 100
    }

    // Chart Data
    const chartParams = {
      $match: {
        createdAt: { $gte: startDate },
        status: BookingStatus.Completed
      }
    }

    // Revenue Chart
    const revenueChart = await Booking.aggregate([
      chartParams,
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
          value: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Booking Chart
    const bookingChart = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
          value: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    new SuccessResponse({
      message: 'Get statistics success',
      metadata: {
        stats: {
          revenue: totalRevenue,
          bookings: totalBookings,
          newCustomers: newCustomers,
          growth: growth,
          bookingsGrowth,
          newCustomersGrowth
        },
        charts: {
          revenue: revenueChart.map((item) => ({ name: item._id, value: item.value })),
          bookings: bookingChart.map((item) => ({ name: item._id, value: item.value }))
        },
        topBarbers,
        services: serviceDist.map((item, index) => ({
          ...item,
          color: `hsl(45, 93%, ${47 + index * 10}%)`
        })),
        recentBookings: recentBookings.map((b) => ({
          id: b._id,
          customer: (b.user as any)?.name || 'Unknown',
          serviceName: (b.service as any)?.name || 'Unknown',
          barberName: (b.barber as any)?.name || 'Unknown',
          time: new Date(b.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          status: b.status
        }))
      }
    }).send(res)
  }
}

export default new StatisticsController()
