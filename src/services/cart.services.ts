import CartModel from '~/models/cart.model'
import ProductModel from '~/models/product.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { AddToCartReqBody, UpdateCartItemReqBody } from '~/requestSchemas/cart.request'
import { ObjectId } from 'mongodb'

class CartService {
  static getCart = async (userId: string | ObjectId) => {
    let cart = await CartModel.findOne({ user: userId, isDeleted: false }).populate(
      'items.product',
      'name price images category'
    )
    if (!cart) {
      // Create empty cart if not exists
      cart = await CartModel.create({
        user: userId,
        items: [],
        totalPrice: 0
      })
    }
    return cart
  }

  static addToCart = async (userId: string | ObjectId, { product, quantity }: AddToCartReqBody) => {
    // Check product existence
    const foundProduct = await ProductModel.findOne({ _id: product, isDeleted: false })
    if (!foundProduct) throw new NotFoundError('Product not found')

    // Check stock
    if (foundProduct.stock < quantity) {
      throw new BadRequestError(`Product out of stock. Available: ${foundProduct.stock}`)
    }

    let cart = await CartModel.findOne({ user: userId, isDeleted: false })
    if (!cart) {
      cart = await CartModel.create({
        user: userId,
        items: [],
        totalPrice: 0
      })
    }

    // Check if item exists in cart
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === product)

    if (itemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[itemIndex].quantity + quantity
      if (foundProduct.stock < newQuantity) {
        throw new BadRequestError(`Product out of stock. Available: ${foundProduct.stock}`)
      }
      cart.items[itemIndex].quantity = newQuantity
    } else {
      // Add new item
      // @ts-ignore
      cart.items.push({ product, quantity })
    }

    await cart.save()
    return await cart.populate('items.product', 'name price images category')
  }

  static updateItemQuantity = async (userId: string | ObjectId, { product, quantity }: UpdateCartItemReqBody) => {
    const cart = await CartModel.findOne({ user: userId, isDeleted: false })
    if (!cart) throw new NotFoundError('Cart not found')

    const foundProduct = await ProductModel.findOne({ _id: product, isDeleted: false })
    if (!foundProduct) throw new NotFoundError('Product not found')

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === product)
    if (itemIndex === -1) throw new NotFoundError('Item not found in cart')

    if (foundProduct.stock < quantity) {
      throw new BadRequestError(`Product out of stock. Available: ${foundProduct.stock}`)
    }

    cart.items[itemIndex].quantity = quantity
    await cart.save()
    return await cart.populate('items.product', 'name price images category')
  }

  static removeItem = async (userId: string | ObjectId, productId: string) => {
    const cart = await CartModel.findOne({ user: userId, isDeleted: false })
    if (!cart) throw new NotFoundError('Cart not found')

    cart.items = cart.items.filter((item) => item.product.toString() !== productId)

    await cart.save()
    return await cart.populate('items.product', 'name price images category')
  }

  static clearCart = async (userId: string | ObjectId) => {
    const cart = await CartModel.findOne({ user: userId, isDeleted: false })
    if (!cart) throw new NotFoundError('Cart not found')

    cart.items = []
    cart.totalPrice = 0

    await cart.save()
    return cart
  }
}

export default CartService
