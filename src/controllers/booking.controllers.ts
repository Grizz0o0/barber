import { Request, Response } from 'express'
import BookingService from '~/services/booking.services'
import { SuccessResponse, Created } from '~/responses/success.response'

class BookingController {
  static createBooking = async (req: Request, res: Response) => {
    const { userId } = req.keyStore! // Assuming user ID is from auth
    new Created({
      message: 'Create booking success',
      metadata: await BookingService.createBooking(userId, req.body)
    }).send(res)
  }

  static getAllBookings = async (req: Request, res: Response) => {
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
}

export default BookingController
