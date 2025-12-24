import envConfig from '~/config/env.config'
import UserModel from '~/models/user.model'
import bcrypt from 'bcrypt'
import { UserRole, UserAuthProvider, UserVerifyStatus } from '~/constants/user'

export const initAdminAccount = async () => {
  const adminEmail = envConfig.ADMIN_EMAIL
  const adminPassword = envConfig.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) return

  const existingAdmin = await UserModel.findOne({ email: adminEmail })
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    await UserModel.create({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.Admin,
      verify: UserVerifyStatus.Verified,
      authProvider: UserAuthProvider.Local,
      isActive: true
    })
    console.log('Admin account initialized')
  } else {
    console.log('Admin already exists')
  }
}
