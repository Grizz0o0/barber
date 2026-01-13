import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import instanceMongodb from '~/dbs/init.mongodb'
import cors from 'cors'
import 'dotenv/config'
import { Request, Response, NextFunction } from 'express'
import router from '~/routes'
import { ErrorResponse } from '~/responses/error.response'
import { initFolder } from '~/utils/files.utils'
import { apiLimiter } from '~/middlewares/rateLimit.middleware'
import mongoSanitize from 'express-mongo-sanitize'
import envConfig from '~/config/env.config'
import { initAdminAccount } from '~/services/initAdmin.services'
import { startCronJobs } from '~/utils/cron'

const app = express()
//init folder
initFolder()
startCronJobs()

// init middlewares
app.use(
  cors({
    origin: [envConfig.CLIENT_URL, 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'x-api-key', 'authorization', 'x-client-id', 'x-rtoken-id']
  })
)
app.use(morgan('dev'))
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
)
app.use(compression())
app.use(
  express
    .json
    // { limit: '50kb' }
    ()
)
app.use(
  express.urlencoded({
    extended: true
    // limit: '50kb'
  })
)

// app.use(mongoSanitize({}))
app.use(apiLimiter)

// init db
instanceMongodb

// init admin
initAdminAccount()

// init route
app.use('/', router)

// handling error
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new ErrorResponse('Not Found', 404)
  next(error)
})

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error instanceof ErrorResponse ? error.status : 500

  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: error.message || 'Internal Server Error',
    stack: error.stack
  })
})

export default app
