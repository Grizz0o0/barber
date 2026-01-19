import app from './src/app'
import { createServer } from 'http'
import { logger } from './src/utils/logger.utils'
import SocketService from './src/services/socket.services'

import instanceMongodb from './src/dbs/init.mongodb'
import { initAdminAccount } from './src/services/initAdmin.services'
import { startCronJobs } from './src/utils/cron'
import { initFolder } from './src/utils/files.utils'

const PORT = process.env.APP_PORT || 3052

const httpServer = createServer(app)

// Init Socket.io
SocketService.getInstance().init(httpServer)

const startServer = async () => {
  try {
    // 1. Init Folder
    initFolder()

    // 2. Connect Database
    await instanceMongodb.connect()

    // 3. Init Admin & Cron
    await initAdminAccount()
    startCronJobs()

    // 4. Start Server
    const server = httpServer.listen(PORT, () => {
      logger.info(`Server running at http://localhost:${PORT}/`)
    })

    process.on('SIGINT', () => {
      server.close(() => console.log(`Exit Server Express`))
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
