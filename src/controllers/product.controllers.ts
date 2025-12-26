import { Request, Response } from 'express'
import ProductService from '~/services/product.services'
import { SuccessResponse, Created } from '~/responses/success.response'

class ProductController {
  static createProduct = async (req: Request, res: Response) => {
    new Created({
      message: 'Create product success',
      metadata: await ProductService.createProduct(req.body)
    }).send(res)
  }

  static getAllProducts = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get list products success',
      metadata: await ProductService.getAllProducts(req.query)
    }).send(res)
  }

  static getProductById = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Get product detail success',
      metadata: await ProductService.getProductById(req.params.id)
    }).send(res)
  }

  static updateProduct = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Update product success',
      metadata: await ProductService.updateProduct(req.params.id, req.body)
    }).send(res)
  }

  static deleteProduct = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: 'Delete product success',
      metadata: await ProductService.deleteProduct(req.params.id, req.keyStore!.userId)
    }).send(res)
  }
}

export default ProductController
