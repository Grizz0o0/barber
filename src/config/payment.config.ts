import envConfig from '~/config/env.config'

export const momoConfig = {
  accessKey: envConfig.MOMO_ACCESS_KEY ?? '',
  secretKey: envConfig.MOMO_SECRET_KEY ?? '',
  partnerCode: envConfig.MOMO_PARTNER_CODE ?? 'MOMO',
  partnerName: envConfig.MOMO_PARTNER_NAME ?? 'Travel',
  storeId: envConfig.MOMO_STORE_ID ?? '',
  ipnUrl: envConfig.MOMO_IPN_URL ?? '',
  hostname: envConfig.MOMO_HOSTNAME ?? 'test-payment.momo.vn',
  path: envConfig.MOMO_PATH ?? '/v2/gateway/api/create'
}
