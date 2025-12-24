import 'dotenv/config'

export const momoConfig = {
  accessKey: process.env.MOMO_ACCESS_KEY ?? '',
  secretKey: process.env.MOMO_SECRET_KEY ?? '',
  partnerCode: process.env.MOMO_PARTNER_CODE ?? 'MOMO',
  partnerName: process.env.MOMO_PARTNER_NAME ?? 'Travel',
  storeId: process.env.MOMO_STORE_ID ?? '',
  ipnUrl: process.env.MOMO_IPN_URL ?? '',
  hostname: process.env.MOMO_HOSTNAME ?? 'test-payment.momo.vn',
  path: process.env.MOMO_PATH ?? '/v2/gateway/api/create'
}
