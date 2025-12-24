import app from './src/app'
import { Server } from 'http'
import { logger } from './src/utils/logger.utils'
const PORT = process.env.APP_PORT || 3000

const server: Server = app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}/`)
})

process.on('SIGINT', () => {
  server.close(() => console.log(`Exit Server Express`))
})
