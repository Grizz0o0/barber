import mongoose from 'mongoose'
import User from '../models/user.model'
import { UserRole } from '../constants/user'
import config from '../config/mongodb.config'

const { name, databaseUrl } = config.database
const connectString = databaseUrl || `mongodb://localhost:27017/${name}`
const verify = async () => {
  await mongoose.connect(connectString)

  const barber = await User.findOne({ role: UserRole.Barber })
  console.log('--------------------------------------------------')
  console.log(`Barber Name: ${barber?.name}`)
  console.log(`Experience: ${barber?.experience}`)
  console.log(`Specialty: ${barber?.specialty}`)
  console.log(`Bio: ${barber?.bio}`)
  console.log('--------------------------------------------------')

  await mongoose.disconnect()
}

verify()
