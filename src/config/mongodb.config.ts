'use strict'
import 'dotenv/config'
import envConfig from './env.config'
interface AppConfig {
  app: {
    port: number | string
  }
  database: {
    name: string
    databaseUrl?: string
  }
}

const dev: AppConfig = {
  app: {
    port: envConfig.APP_PORT || 3052
  },
  database: {
    name: envConfig.DEV_DB_NAME || 'BarberDev',
    databaseUrl: envConfig.DEV_DATABASE_URL || 'mongodb://localhost:27017/BarberDev'
  }
}

const pro: AppConfig = {
  app: {
    port: envConfig.APP_PORT || 3052
  },
  database: {
    name: envConfig.PRO_DB_NAME || 'BarberPro',
    databaseUrl: envConfig.PRO_DATABASE_URL || 'mongodb://localhost:27017/BarberPro'
  }
}

const config: Record<string, AppConfig> = { dev, pro }
const env: string = envConfig.NODE_ENV || 'dev'

export default config[env]
