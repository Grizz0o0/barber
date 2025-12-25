import app from './src/app'
import { createServer } from 'http'
import { logger } from './src/utils/logger.utils'
import SocketService from './src/services/socket.services'

const PORT = process.env.APP_PORT || 3052

const httpServer = createServer(app)

// Init Socket.io
SocketService.getInstance().init(httpServer)

const server = httpServer.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}/`)
})

process.on('SIGINT', () => {
  server.close(() => console.log(`Exit Server Express`))
})
