import ProductModel from '~/models/product.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { getSelectData, getInfoData } from '~/utils/object.utils'
import { createPagination } from '~/responses/success.response'
import { CreateProductReqBody, UpdateProductReqBody, GetListProductQuery } from '~/requestSchemas/product.request'
import { ObjectId } from 'mongodb'

class ProductService {
  static createProduct = async (payload: CreateProductReqBody) => {
    const newProduct = await ProductModel.create(payload)
    if (!newProduct) throw new BadRequestError('Error create product')
    return newProduct
  }

  static getAllProducts = async ({
    limit = 10,
    page = 1,
    order = 'desc',
    sortBy = 'createdAt',
    category,
    search,
    isActive
  }: GetListProductQuery) => {
    const skip = ((page || 1) - 1) * (limit || 10)
    const sortOrder = order === 'asc' ? 1 : -1
    const sortCondition: { [key: string]: 1 | -1 } = { [sortBy || 'createdAt']: sortOrder }

    const filter: any = { isDeleted: false }

    if (category) {
      filter.category = category
    }

    if (isActive) {
      filter.isActive = isActive === 'true'
    }

    if (search) {
      filter.$text = { $search: search }
    }

    const totalItems = await ProductModel.countDocuments(filter)

    const products = await ProductModel.find(filter)
      .sort(sortCondition)
      .skip(skip)
      .limit(limit || 10)
      .lean()

    const pagination = createPagination(page || 1, limit || 10, totalItems)

    return { products, pagination }
  }

  static getProductById = async (productId: string) => {
    const foundProduct = await ProductModel.findOne({ _id: productId, isDeleted: false })
    if (!foundProduct) throw new NotFoundError('Product not found')
    return foundProduct
  }

  static updateProduct = async (productId: string, payload: UpdateProductReqBody) => {
    const foundProduct = await ProductModel.findOne({ _id: productId, isDeleted: false })
    if (!foundProduct) throw new NotFoundError('Product not found')

    const updatedProduct = await ProductModel.findByIdAndUpdate(productId, payload, { new: true })
    if (!updatedProduct) throw new BadRequestError('Update product failed')

    return updatedProduct
  }

  static deleteProduct = async (productId: string, userId: string | ObjectId) => {
    const foundProduct = await ProductModel.findOne({ _id: productId, isDeleted: false })
    if (!foundProduct) throw new NotFoundError('Product not found')

    // Soft delete
    const deletedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
      { new: true }
    )

    if (!deletedProduct) throw new BadRequestError('Delete product failed')

    return deletedProduct
  }
}

export default ProductService
