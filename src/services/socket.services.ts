import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import { logger } from '~/utils/logger.utils'
import envConfig from '~/config/env.config'

class SocketService {
  private static instance: SocketService
  private io: SocketIOServer | null = null

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  public init(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: envConfig.CLIENT_URL, // Match with Express cors config
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
      }
    })

    this.io.on('connection', (socket: Socket) => {
      logger.info(`User connected: ${socket.id}`)

      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`)
      })
    })

    logger.info('Socket.io initialized')
  }

  public getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io not initialized!')
    }
    return this.io
  }

  public emit(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data)
    } else {
      logger.warning('Socket.io is not initialized, cannot emit event')
    }
  }
}

export default SocketService
