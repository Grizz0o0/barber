import { Request, Response } from 'express'
import BookingService from '~/services/booking.services'
import { SuccessResponse, Created } from '~/responses/success.response'
import { UserRole } from '~/constants/user'

class BookingController {
  static createBooking = async (req: Request, res: Response) => {
    const { userId } = req.keyStore! // Assuming user ID is from auth
    new Created({
      message: 'Create booking success',
      metadata: await BookingService.createBooking(userId, req.body)
    }).send(res)
  }

  static getAllBookings = async (req: Request, res: Response) => {
    const { userId, role } = req.user as any
    // Customers can only view their own booking history
    if (role === UserRole.Customer) {
      req.query.user = userId
    }

    new SuccessResponse({
      message: 'Get list bookings success',
      metadata: await BookingService.getAllBookings(req.query)
    }).send(res)
  }

  static getBookingById = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get booking detail success',
      metadata: await BookingService.getBookingById(req.params.id)
    }).send(res)
  }

  static updateBooking = async (req: Request, res: Response) => {
    const { userId, role } = req.user as any
    new SuccessResponse({
      message: 'Update booking success',
      metadata: await BookingService.updateBooking(req.params.id, userId, role, req.body)
    }).send(res)
  }

  static deleteBooking = async (req: Request, res: Response) => {
    const { userId, role } = req.user as any
    new SuccessResponse({
      message: 'Delete booking success',
      metadata: await BookingService.deleteBooking(req.params.id, userId, role)
    }).send(res)
  }
  static handleEmergency = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Handle emergency success',
      metadata: await BookingService.handleEmergency(req.body)
    }).send(res)
  }
}

export default BookingController
