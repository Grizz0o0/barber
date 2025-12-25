import { Request, Response } from 'express'
import CartService from '~/services/cart.services'
import { SuccessResponse } from '~/responses/success.response'

class CartController {
  static getCart = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Get cart success',
      metadata: await CartService.getCart(userId)
    }).send(res)
  }

  static addToCart = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Add to cart success',
      metadata: await CartService.addToCart(userId, req.body)
    }).send(res)
  }

  static updateItemQuantity = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Update item quantity success',
      metadata: await CartService.updateItemQuantity(userId, req.body)
    }).send(res)
  }

  static removeItem = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Remove item success',
      metadata: await CartService.removeItem(userId, req.params.productId)
    }).send(res)
  }

  static clearCart = async (req: Request, res: Response) => {
    const { userId } = req.keyStore!
    new SuccessResponse({
      message: 'Clear cart success',
      metadata: await CartService.clearCart(userId)
    }).send(res)
  }
}

export default CartController
