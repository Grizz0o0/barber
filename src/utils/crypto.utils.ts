import crypto from 'crypto'
/**
 * Hàm tạo cặp khóa RSA (Bất đồng bộ)
 */
const generateRSAKeyPair = async (): Promise<{ privateKey: string; publicKey: string }> => {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
      },
      (err, publicKey, privateKey) => {
        if (err) reject(err)
        else resolve({ publicKey, privateKey })
      }
    )
  })
}

const generateKey = async () => {
  const keyString = 'Travel: verify-email-token'
  const secretKey = crypto.createSecretKey(Buffer.from(keyString, 'utf-8'))
  const hexString = secretKey.export().toString('hex')
  console.log('Secret Key:', hexString)
  return hexString
}

function generateRandomPassword(length = 10): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'
  return Array.from(crypto.randomBytes(length))
    .map((byte) => charset[byte % charset.length])
    .join('')
}

export { generateRSAKeyPair, generateKey, generateRandomPassword }
