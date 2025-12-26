import { z } from 'zod'
import { PaymentMethod, PaymentStatus } from '~/constants/payments'

export const paymentMoMoSchema = {
  body: z
    .object({
      amount: z.number().min(1000, 'Số tiền tối thiểu là 1000 VND').max(20000000, 'Số tiền tối đa là 20.000.000 VND'),
      bookingId: z.string().optional(),
      orderId: z.string().optional(), // Should check validity if provided
      orderInfo: z.string().min(1, 'Thông tin đơn hàng là bắt buộc'),
      lang: z.enum(['vi', 'en']).default('vi')
    })
    .refine((data) => data.bookingId || data.orderId, {
      message: 'Phải cung cấp bookingId hoặc orderId',
      path: ['bookingId', 'orderId']
    })
}

export const updatePaymentStatusSchema = {
  params: z.object({
    id: z.string().min(1, 'Payment ID là bắt buộc')
  }),
  body: z.object({
    status: z.nativeEnum(PaymentStatus)
  })
}

export const getPaymentSchema = {
  query: z.object({
    limit: z.coerce.number().positive().optional(),
    page: z.coerce.number().positive().optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    bookingId: z.string().optional(),
    orderId: z.string().optional()
  })
}

export type PaymentMoMoReqBody = z.infer<typeof paymentMoMoSchema.body>
export type UpdatePaymentStatusReqBody = z.infer<typeof updatePaymentStatusSchema.body>
export type GetPaymentQuery = z.infer<typeof getPaymentSchema.query>
