import { PaymentMethod, PaymentStatus } from '~/constants/payments'

export interface MomoPaymentInitResponse {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number
  responseTime: number
  message: string
  resultCode: number
  payUrl: string
  shortLink: string
}

export interface MomoPaymentConfirmResponse {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number
  orderInfo: string
  orderType: string
  transId: number
  resultCode: number
  message: string
  payType: string
  responseTime: number
  extraData: string
  signature: string
}
