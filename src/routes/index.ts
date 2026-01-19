'use strict'
import { Router } from 'express'
import mediasRouter from './medias.routes'
import authRouter from './auth.routes'
import usersRouter from './user.routes'
import productRouter from './product.routes'
import systemConfigRouter from './systemConfig.routes'
import serviceItemRouter from './serviceItem.routes'
import barberScheduleRouter from './barberSchedule.routes'
import bookingRouter from './booking.routes'
import cartRouter from './cart.routes'
import orderRouter from './order.routes'
import promotionRouter from './promotion.routes'
import paymentRouter from './payment.routes'
import reviewRouter from './review.routes'
import notificationRouter from './notification.routes'
import statisticsRouter from './statistics.routes'
import aiRouter from './ai.routes'
import chatRouter from './chat.routes'
const router = Router()

router.use('/ai', aiRouter)
router.use('/medias', mediasRouter)
router.use('/products', productRouter)
router.use('/system-configs', systemConfigRouter)
router.use('/services', serviceItemRouter)
router.use('/chat', chatRouter)
router.use('/barber-schedules', barberScheduleRouter)
router.use('/bookings', bookingRouter)
router.use('/cart', cartRouter)
router.use('/orders', orderRouter)
router.use('/promotions', promotionRouter)
router.use('/payments', paymentRouter)
router.use('/reviews', reviewRouter)
router.use('/notifications', notificationRouter)
router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/statistics', statisticsRouter)

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hello world'
  })
})

export default router
