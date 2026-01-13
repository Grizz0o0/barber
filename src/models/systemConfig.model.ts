import mongoose, { Schema, Document } from 'mongoose'

export interface ISystemConfig extends Document {
  storeName: string
  address: string
  phone: string
  email: string
  workingHours: {
    weekdays: string
    weekend: string
  }
  socials: {
    facebook: string
    instagram: string
  }
  description?: string
  logo?: string
}

const SystemConfigSchema: Schema = new Schema(
  {
    storeName: { type: String, required: true, default: 'BarberShop' },
    address: { type: String, required: true, default: 'Hà Nội' },
    phone: { type: String, required: true, default: '19001234' },
    email: { type: String, required: true, default: 'contact@barbershop.com' },
    workingHours: {
      weekdays: { type: String, default: '9:00 - 20:00' },
      weekend: { type: String, default: '8:00 - 21:00' }
    },
    socials: {
      facebook: { type: String, default: '#' },
      instagram: { type: String, default: '#' }
    },
    description: { type: String },
    logo: { type: String }
  },
  {
    timestamps: true
  }
)

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema)
