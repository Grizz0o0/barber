import { Router } from 'express'
import ProductController from '~/controllers/product.controllers'
import { authentication, authorizeRoles } from '~/middlewares/auth.middlewares'
import { validateRequest } from '~/middlewares/validate.middleware'
import { asyncHandler } from '~/helpers/asyncHandler'
import { UserRole } from '~/constants/user'
import {
  createProductSchema,
  deleteProductSchema,
  getListProductSchema,
  getProductByIdSchema,
  updateProductSchema
} from '~/requestSchemas/product.request'

const productRouter = Router()

// Public routes
productRouter.get('/', validateRequest(getListProductSchema), asyncHandler(ProductController.getAllProducts))

productRouter.get('/:id', validateRequest(getProductByIdSchema), asyncHandler(ProductController.getProductById))

// Protected routes (Admin only)
productRouter.use(authentication)
productRouter.use(authorizeRoles(UserRole.Admin)) // Apply admin check for creating/updating/deleting

productRouter.post('/', validateRequest(createProductSchema), asyncHandler(ProductController.createProduct))

productRouter.patch('/:id', validateRequest(updateProductSchema), asyncHandler(ProductController.updateProduct))

productRouter.delete('/:id', validateRequest(deleteProductSchema), asyncHandler(ProductController.deleteProduct))

export default productRouter
