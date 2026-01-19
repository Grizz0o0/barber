import z from 'zod'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

// Kiểm tra đã có file .env chưa

if (!fs.existsSync(path.resolve('.env'))) {
  console.log('Không tìm thấy file .env')
  process.exit(1)
}

const configSchema = z.object({
  // App Configuration
  APP_PORT: z.string(),
  CLIENT_URL: z.string(),
  HOST: z.string(),
  NODE_ENV: z.enum(['dev', 'pro']).default('dev'),

  // Admin Credentials
  ADMIN_EMAIL: z.string(),
  ADMIN_PASSWORD: z.string(),

  // JWT Configuration
  JWT_SECRET_ACCESS_TOKEN: z.string(),
  JWT_SECRET_REFRESH_TOKEN: z.string(),
  JWT_SECRET_VERIFY_EMAIL_TOKEN: z.string(),
  JWT_SECRET_FORGOT_PASSWORD_TOKEN: z.string(),

  // Database Configuration (MongoDB)
  DEV_DB_NAME: z.string(),
  DEV_DATABASE_URL: z.string(),

  PRO_DB_NAME: z.string(),
  PRO_DATABASE_URL: z.string(),

  // Payment Configuration (Momo)
  MOMO_ACCESS_KEY: z.string(),
  MOMO_SECRET_KEY: z.string(),
  MOMO_REDIRECT_URI: z.string(),
  MOMO_IPN_URL: z.string(),
  MOMO_HOSTNAME: z.string(),
  MOMO_PORT: z.string(),
  MOMO_PATH: z.string(),
  MOMO_STORE_ID: z.string(),
  MOMO_PARTNER_CODE: z.string(),
  MOMO_PARTNER_NAME: z.string(),
  MOMO_LANG: z.string(),
  MOMO_ORDER_INFO: z.string(),

  // AWS Services - Removed
  // AWS_ACCESS_KEY_ID: z.string(),
  // AWS_SECRET_ACCESS_KEY: z.string(),
  // AWS_REGION: z.string(),
  // SES_FROM_ADDRESS: z.string(),

  // OAuth Configuration (Google)
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GOOGLE_CLIENT_REDIRECT_URI: z.string(),

  // AI Configuration (Gemini)
  GEMINI_API_KEY: z.string()
})

const configServer = configSchema.safeParse(process.env)

if (!configServer.success) {
  console.error('Các giá trị khai báo trong file .env không hợp lệ')
  console.error(configServer.error.flatten().fieldErrors)
  process.exit(1)
}

const envConfig = configServer.data
export default envConfig
