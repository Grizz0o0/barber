import { z } from 'zod'

export const createServiceItemSchema = {
  body: z.object({
    name: z.string({ error: 'Tên dịch vụ là bắt buộc' }).min(1, 'Tên dịch vụ không được để trống').trim(),
    price: z.coerce.number({ error: 'Giá là bắt buộc' }).min(0, 'Giá phải >= 0'),
    duration: z.coerce.number({ error: 'Thời lượng là bắt buộc' }).min(15, 'Thời lượng ít nhất 15 phút'),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().default(true)
  })
}

export type CreateServiceItemReqBody = z.infer<typeof createServiceItemSchema.body>

export const updateServiceItemSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  }),
  body: z.object({
    name: z.string().min(1, 'Tên dịch vụ không được để trống').trim().optional(),
    price: z.coerce.number().min(0, 'Giá phải >= 0').optional(),
    duration: z.coerce.number().min(15, 'Thời lượng ít nhất 15 phút').optional(),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  })
}

export type UpdateServiceItemReqBody = z.infer<typeof updateServiceItemSchema.body>
export type UpdateServiceItemReqParams = z.infer<typeof updateServiceItemSchema.params>

export const deleteServiceItemSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  })
}

export type DeleteServiceItemReqParams = z.infer<typeof deleteServiceItemSchema.params>

export const getServiceItemByIdSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  })
}

export type GetServiceItemByIdReqParams = z.infer<typeof getServiceItemByIdSchema.params>

export const getListServiceItemSchema = {
  query: z.object({
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    sortBy: z.enum(['createdAt', 'price', 'name', 'duration']).optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional()
  })
}

export type GetListServiceItemQuery = z.infer<typeof getListServiceItemSchema.query>
