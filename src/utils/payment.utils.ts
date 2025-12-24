import crypto from 'crypto'
import { momoConfig } from '~/config/payment.config'

function generateOrderId(): string {
  return `${momoConfig.partnerCode}${Date.now()}`
}

function generateSignature({ rawSignature, secretKey }: { rawSignature: string; secretKey: string }): string {
  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex')
  return signature
}

/**
 * Tạo rawSignature theo thứ tự alphabet key như yêu cầu của MoMo
 */
function buildRawSignature(params: Record<string, string | number | boolean>): string {
  const sortedKeys = Object.keys(params).sort()
  return sortedKeys.map((key) => `${key}=${params[key]}`).join('&')
}
export { generateOrderId, generateSignature, buildRawSignature }
