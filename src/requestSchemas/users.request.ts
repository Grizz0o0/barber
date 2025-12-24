import { z } from 'zod'

export const PaginationParams = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  order: z.enum(['asc', 'desc']).default('asc'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt')
})
export type PaginationParamsType = z.infer<typeof PaginationParams>

export const deleteUserSchema = {
  params: z.object({
    id: z.string().trim().min(1, {
      message: 'Id không được để trống'
    })
  })
}
export type deleteUserReqParamsType = z.infer<typeof deleteUserSchema.params>

export const getUserByIdSchema = {
  params: z.object({
    id: z.string().trim().min(1, {
      message: 'Id không được để trống'
    })
  })
}
export type getUserByIdReqParamsType = z.infer<typeof getUserByIdSchema.params>

export const updateMeSchema = {
  body: z.object({
    name: z
      .string({ error: 'Tên người dùng không được để trống' })
      .min(1, 'Tên người dùng phải có từ 1 đến 255 ký tự')
      .max(255, 'Tên người dùng phải có từ 1 đến 255 ký tự')
      .trim()
      .optional(),
    email: z.email('Email không hợp lệ').trim().optional(),
    avatar: z.string({ error: 'Avatar phải là chuỗi' }).trim().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ (bắt đầu bằng 0, 10-11 số)')
      .optional(),
    address: z
      .object({
        street: z.string().optional(),
        district: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional()
      })
      .optional()
  }),
  params: z.object({
    id: z.string().trim().min(1, {
      message: 'Id không được để trống'
    })
  })
}
export type updateMeReqBodyType = z.infer<typeof updateMeSchema.body>

export const getListUserSchema = {
  query: z.object({
    limit: z.coerce.number().int('Giới hạn phải là số nguyên').positive('Giới hạn phải > 0').optional(),
    page: z.coerce.number().int('Số trang phải là số nguyên').positive('Số trang phải > 0').optional(),
    order: z.enum(['asc', 'desc']).optional(),
    select: z.array(z.string()).optional()
  })
}

export type getListUserTypeQuery = z.infer<typeof getListUserSchema.query>
