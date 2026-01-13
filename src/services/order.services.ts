import OrderModel from '~/models/order.model'
import ProductModel from '~/models/product.model'
import UserModel from '~/models/user.model'
import CartModel from '~/models/cart.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { createPagination } from '~/responses/success.response'
import { CreateOrderReqBody, UpdateOrderReqBody, GetOrderQuery } from '~/requestSchemas/order.request'
import SocketService from '~/services/socket.services'
import PromotionService from '~/services/promotion.services'
import { ObjectId } from 'mongodb'
import { UserRole } from '~/constants/user'
import { sendOrderSuccessEmail } from '~/utils/email.utils'
import NotificationService from '~/services/notification.services'
import { NotificationType } from '~/models/notification.model'

class OrderService {
  static createOrder = async (userId: string | ObjectId, payload: CreateOrderReqBody) => {
    const { items, shippingAddress, promotion } = payload

    if (!items || items.length === 0) {
      throw new BadRequestError('Đơn hàng phải có ít nhất 1 sản phẩm')
    }

    const user = await UserModel.findOne({ _id: userId, isDeleted: false, isActive: true })
    if (!user) throw new NotFoundError('User not found or inactive')

    // 1. Prepare items and Deduct Stock Atomically
    const orderItems = []
    let totalPrice = 0

    // Using a loop here to handle each product individually.
    // Ideally use a Session/Transaction, but assuming standalone MongoDB might not support it,
    // we use atomic $inc with stock check condition.

    // Rollback list in case of partial failure
    const deductedProducts: { id: string; qty: number }[] = []

    try {
      for (const item of items) {
        // Atomic Check and Update: Decrement stock ONLY if stock >= quantity
        const product = await ProductModel.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity }, isDeleted: false },
          { $inc: { stock: -item.quantity } },
          { new: true }
        )

        if (!product) {
          // If null, it means either product not found OR stock insufficient
          const existProduct = await ProductModel.findById(item.product)
          if (!existProduct) throw new NotFoundError(`Sản phẩm ${item.product} không tồn tại`)
          throw new BadRequestError(`Sản phẩm ${existProduct.name} không đủ hàng`)
        }

        deductedProducts.push({ id: String(item.product), qty: item.quantity })

        orderItems.push({
          product: product._id,
          nameAtPurchase: product.name,
          priceAtPurchase: product.price,
          quantity: item.quantity
        })

        totalPrice += product.price * item.quantity
      }

      // 4.5 Apply Promotion (If exists)
      let finalPrice = totalPrice
      let discountAmount = 0
      let promotionId: string | ObjectId | undefined

      if (promotion) {
        // Validate promotion
        const checkPromo = await PromotionService.verifyPromotion(promotion.toString(), totalPrice, 'product')
        if (!checkPromo.isValid) {
          // Restore stock before throwing
          throw new BadRequestError(checkPromo.message || 'Promotion invalid')
        }
        discountAmount = checkPromo.discountAmount
        finalPrice = totalPrice - discountAmount
        promotionId = checkPromo.promotionId
      }

      // Determine initial status
      let initialStatus = 'processing'
      if (payload.paymentMethod === 'MoMo' || payload.paymentMethod === 'Banking') {
        initialStatus = 'pending_payment'
      }

      // 2. Create Order
      const newOrder = await OrderModel.create({
        user: userId,
        items: orderItems,
        totalPrice: finalPrice,
        discountAmount,
        shippingAddress,
        promotion: promotionId,
        status: initialStatus,
        paymentMethod: payload.paymentMethod,
        paymentStatus: 'unpaid'
      })

      if (!newOrder) {
        throw new Error('Create order failed')
      }

      // 3. Remove ordered items from Cart and Recalculate
      const cart = await CartModel.findOne({ user: userId, isDeleted: false })
      if (cart) {
        const orderedProductIds = items.map((i) => i.product.toString())
        cart.items = cart.items.filter((i) => !orderedProductIds.includes(i.product.toString()))
        await cart.save() // Triggers pre-save hook to recalc totalPrice
      }

      // 4. Emit Socket & Send Email
      SocketService.getInstance().emit('order:created', newOrder)
      sendOrderSuccessEmail(user.email, newOrder).catch(console.error)

      // 5. Increment Promotion Usage (Async, non-blocking but should be handled)
      if (promotionId) {
        PromotionService.incrementUsage(promotionId).catch(console.error)
      }

      return newOrder
    } catch (error) {
      // Manual Rollback Stock
      for (const deducted of deductedProducts) {
        await ProductModel.findByIdAndUpdate(deducted.id, { $inc: { stock: deducted.qty } })
      }
      throw error // Re-throw to controller
    }
  }

  static getAllOrders = async (
    { limit = 10, page = 1, order = 'desc', sortBy = 'createdAt', status, user }: GetOrderQuery,
    userId: string,
    role: string
  ) => {
    const skip = ((page || 1) - 1) * (limit || 10)
    const sortOrder = order === 'asc' ? 1 : -1
    const sortCondition: { [key: string]: 1 | -1 } = { [sortBy || 'createdAt']: sortOrder }

    const filter: any = { isDeleted: false }

    if (status) filter.status = status

    // Authorization: If not Admin, forced to see own orders
    if (role !== UserRole.Admin) {
      filter.user = new ObjectId(userId)
    } else {
      // If Admin, can filter by user if provided
      if (user) filter.user = user
    }

    const totalItems = await OrderModel.countDocuments(filter)

    const orders = await OrderModel.find(filter)
      .populate('items.product', 'name image')
      .populate('user', 'name email phone avatar')
      .sort(sortCondition)
      .skip(skip)
      .limit(limit || 10)
      .lean()

    const pagination = createPagination(page || 1, limit || 10, totalItems)

    return { orders, pagination }
  }

  static getOrderById = async (orderId: string, userId: string, role: string) => {
    const foundOrder = await OrderModel.findOne({ _id: orderId, isDeleted: false })
      .populate('items.product', 'name image')
      .populate('user', 'name email phone avatar')

    if (!foundOrder) throw new NotFoundError('Order not found')

    // Ownership check
    if (role !== UserRole.Admin && foundOrder.user._id.toString() !== userId.toString()) {
      throw new NotFoundError('Order not found') // conceal existence
    }

    return foundOrder
  }

  static updateOrder = async (orderId: string, payload: UpdateOrderReqBody, userId: string, role: string) => {
    const { status, shippingAddress } = payload

    const foundOrder = await OrderModel.findOne({ _id: orderId, isDeleted: false })
    if (!foundOrder) throw new NotFoundError('Order not found')

    // Ownership check
    if (role !== UserRole.Admin && foundOrder.user.toString() !== userId.toString()) {
      throw new NotFoundError('Order not found')
    }

    // Role-based constraints
    if (role !== UserRole.Admin) {
      // User can only Cancel processing orders
      if (status && status === 'cancelled') {
        if (foundOrder.status !== 'processing') {
          throw new BadRequestError('Chỉ có thể hủy đơn hàng khi đang xử lý')
        }
      } else if (status && status !== foundOrder.status) {
        throw new BadRequestError('Bạn không có quyền thay đổi trạng thái đơn hàng này')
      }

      // User can only update info if processing
      if (shippingAddress && foundOrder.status !== 'processing') {
        throw new BadRequestError('Không thể cập nhật thông tin khi đơn hàng đã qua bước xử lý')
      }
    }

    // Handle Stock Restoration if Cancelled (Shared Logic)

    // Handle Stock Restoration if Cancelled
    if (status === 'cancelled' && foundOrder.status !== 'cancelled') {
      for (const item of foundOrder.items) {
        await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
      }
    }

    // Note: If changing FROM cancelled TO processing, we need to deduct stock again?
    // This is tricky business logic. Usually re-ordering creates a new order.
    // We will block status change from 'cancelled' to others for safety, or implement re-deduct.
    if (foundOrder.status === 'cancelled' && status && status !== 'cancelled') {
      throw new BadRequestError('Không thể cập nhật trạng thái đơn hàng đã hủy')
    }

    if (status) foundOrder.status = status
    if (shippingAddress) {
      foundOrder.shippingAddress.street = shippingAddress.street || foundOrder.shippingAddress.street
      if (shippingAddress.district !== undefined) foundOrder.shippingAddress.district = shippingAddress.district
      foundOrder.shippingAddress.city = shippingAddress.city || foundOrder.shippingAddress.city
      if (shippingAddress.country !== undefined) foundOrder.shippingAddress.country = shippingAddress.country
    }

    const updatedOrder = await foundOrder.save()

    // Emit socket event
    SocketService.getInstance().emit('order:updated', updatedOrder)

    // Notify User
    if (status && status !== foundOrder.status) {
      let message = ''
      if (status === 'shipped') message = 'Đơn hàng đang được vận chuyển'
      if (status === 'delivered') message = 'Đơn hàng đã được giao thành công'
      if (status === 'cancelled') message = 'Đơn hàng đã bị hủy'

      if (message) {
        NotificationService.pushNotification({
          userId: updatedOrder.user,
          title: 'Trạng thái đơn hàng',
          message,
          type: NotificationType.Order,
          referenceId: updatedOrder._id
        }).catch(console.error)
      }
    }

    return updatedOrder
  }

  static deleteOrder = async (orderId: string, userId: string | ObjectId) => {
    const foundOrder = await OrderModel.findOne({ _id: orderId, isDeleted: false })
    if (!foundOrder) throw new NotFoundError('Order not found')

    // Soft delete
    const deletedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
      { new: true }
    )

    if (!deletedOrder) throw new BadRequestError('Delete order failed')

    // Emit socket event
    SocketService.getInstance().emit('order:deleted', deletedOrder)

    return deletedOrder
  }
}

export default OrderService
