import axios from 'axios'
import { ObjectId } from 'mongodb'
import { momoConfig } from '~/config/payment.config'
import { PaymentMethod, PaymentStatus } from '~/constants/payments'
import BookingModel from '~/models/booking.model'
import OrderModel from '~/models/order.model'
import PaymentModel from '~/models/payment.model'
import { PaymentMoMoReqBody, GetPaymentQuery } from '~/requestSchemas/payment.request'
import { BadRequestError, NotFoundError } from '~/responses/error.response'
import { createPagination } from '~/responses/success.response'
import SocketService from '~/services/socket.services'
import { MomoPaymentConfirmResponse, MomoPaymentInitResponse } from '~/types/payments.types'
import { buildRawSignature, generateSignature } from '~/utils/payment.utils'
import NotificationService from '~/services/notification.services'
import { NotificationType } from '~/models/notification.model'

class PaymentService {
  static async paymentMoMo(userId: string | ObjectId, payload: PaymentMoMoReqBody) {
    const { amount, bookingId, orderId, orderInfo, lang } = payload
    const { accessKey, secretKey, partnerCode, ipnUrl, hostname, path, partnerName, storeId } = momoConfig

    if (!accessKey || !secretKey) throw new NotFoundError('MOMO_ACCESS_KEY or MOMO_SECRET_KEY is not defined')

    // Create a unique requestId for MoMo
    const requestId = `${partnerCode}${new Date().getTime()}`
    const momoOrderId = requestId // Using unique requestId as orderId for MoMo side to avoid duplication if user retries

    const redirectUrl = `${process.env.CLIENT_URL}/payment/success` // Adjusted to use CLIENT_URL

    const requestType = 'payWithMethod'
    const extraData = '' // Could pass base64 encoded JSON if needed
    const autoCapture = true
    const orderGroupId = ''

    const rawSignature = buildRawSignature({
      accessKey,
      amount,
      extraData,
      ipnUrl,
      orderId: momoOrderId,
      orderInfo,
      partnerCode,
      redirectUrl,
      requestId,
      requestType
    })
    const signature = generateSignature({ rawSignature, secretKey })

    const requestBody = JSON.stringify({
      partnerCode,
      partnerName,
      storeId,
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      extraData,
      signature,
      autoCapture,
      orderGroupId
    })

    // Create Payment Record in DB (Pending)
    const newPayment = await PaymentModel.create({
      paymentFor: bookingId ? 'booking' : 'order',
      booking: bookingId ? new ObjectId(bookingId) : undefined,
      order: orderId ? new ObjectId(orderId) : undefined,
      amount,
      paymentMethod: PaymentMethod.MOMO,
      status: PaymentStatus.PENDING,
      transactionId: momoOrderId, // Store MoMo's OrderId/RequestId as TransactionId for tracking
      createdBy: userId,
      updatedBy: userId
    })

    try {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: requestBody
      }
      const { data } = await axios.post(`https://${hostname}${path}`, requestBody, options)

      return data as MomoPaymentInitResponse
    } catch (error: any) {
      // If MoMo init fails, maybe delete the pending payment? Or keep it as failed?
      await PaymentModel.findByIdAndUpdate(newPayment._id, { status: PaymentStatus.FAILED })
      throw new BadRequestError(`MoMo Init Error: ${error.message}`)
    }
  }

  static async paymentMoMoIpn(body: MomoPaymentConfirmResponse) {
    const { orderId, resultCode, transId, responseTime, message } = body
    // orderId here is what we sent as momoOrderId (which is stored in transactionId in our DB)

    const payment = await PaymentModel.findOne({ transactionId: orderId })
    if (!payment) throw new NotFoundError('Payment not found')

    const newStatus = resultCode === 0 ? PaymentStatus.SUCCESS : PaymentStatus.FAILED

    // Prevent double update if already success
    if (payment.status === PaymentStatus.SUCCESS) {
      return { message: 'Already confirmed', status: PaymentStatus.SUCCESS }
    }

    const updatedPayment = await PaymentModel.findOneAndUpdate(
      { transactionId: orderId },
      {
        $set: {
          status: newStatus,
          // transactionId: transId.toString(), // Keep our tracking ID or update? Let's append or log.
          // Note: transId from MoMo is their internal ID. We can store it maybe in notes or another field if we had one.
          updatedAt: new Date()
        }
      },
      { new: true }
    )

    if (!updatedPayment) throw new Error('Failed to update payment status')

    // If Success, update Booking/Order status
    if (newStatus === PaymentStatus.SUCCESS) {
      if (updatedPayment.paymentFor === 'booking' && updatedPayment.booking) {
        await BookingModel.findByIdAndUpdate(updatedPayment.booking, {
          status: 'confirmed', // From pending -> confirmed
          paymentStatus: 'paid',
          updatedAt: new Date()
        })
        SocketService.getInstance().emit('booking:updated', {
          _id: updatedPayment.booking,
          status: 'confirmed',
          paymentStatus: 'paid'
        })
      } else if (updatedPayment.paymentFor === 'order' && updatedPayment.order) {
        const order = await OrderModel.findById(updatedPayment.order)
        if (order) {
          // If order was pending_payment, now it becomes processing
          const nextStatus = order.status === 'pending_payment' ? 'processing' : order.status

          await OrderModel.findByIdAndUpdate(updatedPayment.order, {
            status: nextStatus,
            paymentStatus: 'paid',
            updatedAt: new Date()
          })

          SocketService.getInstance().emit('order:updated', {
            _id: updatedPayment.order,
            status: nextStatus,
            paymentStatus: 'paid'
          })
        }
      }

      // Push Notification
      if (updatedPayment.createdBy) {
        NotificationService.pushNotification({
          userId: updatedPayment.createdBy,
          title: 'Thanh toán thành công',
          message: `Thanh toán cho ${updatedPayment.paymentFor} thành công. Mã GD: ${updatedPayment.transactionId}`,
          type: NotificationType.Payment,
          referenceId: updatedPayment._id
        }).catch(console.error)
      }
    } else if (newStatus === PaymentStatus.FAILED) {
      if (updatedPayment.createdBy) {
        NotificationService.pushNotification({
          userId: updatedPayment.createdBy,
          title: 'Thanh toán thất bại',
          message: `Giao dịch ${updatedPayment.transactionId} thất bại. Vui lòng thử lại.`,
          type: NotificationType.Payment,
          referenceId: updatedPayment._id
        }).catch(console.error)
      }
    }

    SocketService.getInstance().emit('payment:updated', updatedPayment)

    return {
      message,
      status: newStatus
    }
  }

  static async updatePaymentStatus(id: string, status: PaymentStatus) {
    const payment = await PaymentModel.findOne({ _id: id, isDeleted: false })
    if (!payment) throw new NotFoundError('Payment not found')

    // logic to update booking/order status if needed... (similar to IPN)

    const updatedPayment = await PaymentModel.findByIdAndUpdate(
      id,
      { status, updatedBy: payment.createdBy }, // Tracker owner as updater if no specific user passed
      { new: true }
    )
    if (!updatedPayment) throw new BadRequestError('Update failed')

    SocketService.getInstance().emit('payment:updated', updatedPayment)
    return updatedPayment
  }

  static async getListPayments({ limit = 10, page = 1, status, paymentMethod, bookingId, orderId }: GetPaymentQuery) {
    const skip = ((page || 1) - 1) * (limit || 10)
    const filter: any = { isDeleted: false }

    if (status) filter.status = status
    if (paymentMethod) filter.paymentMethod = paymentMethod
    if (bookingId) filter.booking = bookingId
    if (orderId) filter.order = orderId

    const totalItems = await PaymentModel.countDocuments(filter)
    const payments = await PaymentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit || 10)
      .lean()

    return {
      payments,
      pagination: createPagination(page || 1, limit || 10, totalItems)
    }
  }

  static async getPaymentById(id: string) {
    const payment = await PaymentModel.findOne({ _id: id, isDeleted: false })
    if (!payment) throw new NotFoundError('Payment not found')
    return payment
  }
}

export default PaymentService
