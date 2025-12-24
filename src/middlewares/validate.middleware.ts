import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

type SchemaGroup = {
  body?: ZodSchema<any>
  params?: ZodSchema<any>
  query?: ZodSchema<any>
  headers?: ZodSchema<any>
}

export const validateRequest = (schemas: SchemaGroup) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        const result = await schemas.body.safeParseAsync(req.body)
        if (!result.success) {
          res.status(400).json({
            message: 'Dữ liệu body không hợp lệ',
            errors: result.error.flatten().fieldErrors
          })
          return
        }
        req.body = result.data
      }

      if (schemas.params) {
        const result = await schemas.params.safeParseAsync(req.params)
        if (!result.success) {
          res.status(400).json({
            message: 'Tham số URL không hợp lệ',
            errors: result.error.flatten().fieldErrors
          })
          return
        }
        req.params = result.data
      }

      if (schemas.query) {
        const result = await schemas.query.safeParseAsync(req.query)
        if (!result.success) {
          res.status(400).json({
            message: 'Tham số query không hợp lệ',
            errors: result.error.flatten().fieldErrors
          })
          return
        }
        req.query = result.data
      }

      if (schemas.headers) {
        const result = await schemas.headers.safeParseAsync(req.headers)
        if (!result.success) {
          res.status(400).json({
            message: 'Tham số headers không hợp lệ',
            errors: result.error.flatten().fieldErrors
          })
          return
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
