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
import envConfig from '~/config/env.config'
import { apiLimiter } from '~/middlewares/rateLimit.middleware'

const app = express()
//init folder
initFolder()

// init middlewares
app.use(morgan('dev'))
app.use(helmet())
app.use(compression())
app.use(express.json({ limit: '10kb' })) // Body limit as requested
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(apiLimiter)

app.use(
  cors({
    origin: envConfig.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'x-api-key', 'authorization', 'x-client-id', 'x-rtoken-id']
  })
)

// init db
instanceMongodb

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
