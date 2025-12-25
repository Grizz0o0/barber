import { z } from 'zod'

export const createBarberScheduleSchema = {
  body: z.object({
    barber: z.string({ error: 'Barber ID là bắt buộc' }).trim().min(1, 'Barber ID không được để trống'),
    dayOfWeek: z.coerce
      .number({ error: 'Ngày trong tuần là bắt buộc' })
      .int()
      .min(0, 'Ngày phải từ 0 (Chủ nhật) đến 6 (Thứ 7)')
      .max(6, 'Ngày phải từ 0 (Chủ nhật) đến 6 (Thứ 7)'),
    startTime: z
      .string({ error: 'Giờ bắt đầu là bắt buộc' })
      .regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Định dạng giờ không hợp lệ (HH:MM)'),
    endTime: z
      .string({ error: 'Giờ kết thúc là bắt buộc' })
      .regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Định dạng giờ không hợp lệ (HH:MM)'),
    isDayOff: z.boolean().optional().default(false)
  })
}

export type CreateBarberScheduleReqBody = z.infer<typeof createBarberScheduleSchema.body>

export const updateBarberScheduleSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  }),
  body: z.object({
    barber: z.string().trim().min(1, 'Barber ID không được để trống').optional(),
    dayOfWeek: z.coerce
      .number()
      .int()
      .min(0, 'Ngày phải từ 0 (Chủ nhật) đến 6 (Thứ 7)')
      .max(6, 'Ngày phải từ 0 (Chủ nhật) đến 6 (Thứ 7)')
      .optional(),
    startTime: z
      .string()
      .regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Định dạng giờ không hợp lệ (HH:MM)')
      .optional(),
    endTime: z
      .string()
      .regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Định dạng giờ không hợp lệ (HH:MM)')
      .optional(),
    isDayOff: z.boolean().optional()
  })
}

export type UpdateBarberScheduleReqBody = z.infer<typeof updateBarberScheduleSchema.body>
export type UpdateBarberScheduleReqParams = z.infer<typeof updateBarberScheduleSchema.params>

export const deleteBarberScheduleSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  })
}

export type DeleteBarberScheduleReqParams = z.infer<typeof deleteBarberScheduleSchema.params>

export const getBarberScheduleSchema = {
  query: z.object({
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    sortBy: z.enum(['createdAt', 'startTime', 'dayOfWeek']).optional(),
    barber: z.string().optional(),
    dayOfWeek: z.coerce.number().int().min(0).max(6).optional()
  })
}

export type GetBarberScheduleQuery = z.infer<typeof getBarberScheduleSchema.query>
