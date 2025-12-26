import { Request, Response } from 'express'
import PaymentService from '~/services/payment.services'
import { SuccessResponse, Created } from '~/responses/success.response'

class PaymentController {
  static createMoMoPayment = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new Created({
      message: 'Init MoMo Payment success',
      metadata: await PaymentService.paymentMoMo(userId, req.body)
    }).send(res)
  }

  static momoIpn = async (req: Request, res: Response) => {
    // IPN is called by MoMo server, no userId in headers, no auth middleware usually (verify signature)
    const result = await PaymentService.paymentMoMoIpn(req.body)
    // MoMo expects 204 No Content usually or 200 JSON
    res.status(200).json(result)
  }

  static updatePaymentStatus = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Update payment status success',
      metadata: await PaymentService.updatePaymentStatus(req.params.id, req.body.status)
    }).send(res)
  }

  static getListPayments = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get list payments success',
      metadata: await PaymentService.getListPayments(req.query)
    }).send(res)
  }

  static getPaymentById = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get payment detail success',
      metadata: await PaymentService.getPaymentById(req.params.id)
    }).send(res)
  }
}

export default PaymentController
