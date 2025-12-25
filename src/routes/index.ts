'use strict'
import { Router } from 'express'
import mediasRouter from './medias.routes'
import authRouter from './auth.routes'
import usersRouter from './user.routes'
import productRouter from './product.routes'
import serviceItemRouter from './serviceItem.routes'
import barberScheduleRouter from './barberSchedule.routes'
import bookingRouter from './booking.routes'
const router = Router()

router.use('/medias', mediasRouter)
router.use('/products', productRouter)
router.use('/services', serviceItemRouter)
router.use('/barber-schedules', barberScheduleRouter)
router.use('/bookings', bookingRouter)
router.use('/auth', authRouter)
router.use('/users', usersRouter)

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hello world'
  })
})

export default router
