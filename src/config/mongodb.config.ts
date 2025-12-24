'use strict'
import 'dotenv/config'
import envConfig from './env.config'
interface AppConfig {
  app: {
    port: number | string
  }
  database: {
    host: string
    port: number | string
    name: string
  }
}

const dev: AppConfig = {
  app: {
    port: envConfig.APP_PORT || 3052
  },
  database: {
    host: envConfig.DEV_DB_HOST || 'localhost',
    port: envConfig.DEV_DB_PORT || 27017,
    name: envConfig.DEV_DB_NAME || 'BarberDev'
  }
}

const pro: AppConfig = {
  app: {
    port: envConfig.APP_PORT || 3052
  },
  database: {
    host: envConfig.PRO_DB_HOST || 'localhost',
    port: envConfig.PRO_DB_PORT || 27017,
    name: envConfig.PRO_DB_NAME || 'BarberPro'
  }
}

const config: Record<string, AppConfig> = { dev, pro }
const env: string = envConfig.NODE_ENV || 'dev'

export default config[env]
