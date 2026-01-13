import { Schema, model, Document, Types } from 'mongoose'
import { UserRole, UserVerifyStatus, UserAuthProvider, GENDERS, type Gender } from '../constants/user'

interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  authProvider: UserAuthProvider
  phone?: string
  address?: {
    street?: string
    district?: string
    city?: string
    country: string
  }
  gender?: Gender
  verify: UserVerifyStatus
  avatar?: string
  isActive: boolean
  rating?: number
  ratingCount?: number
  experience?: number
  specialty?: string
  bio?: string
  forgotPasswordToken?: string
  forgotPasswordExpire?: Date
  resetPasswordToken?: string
  resetPasswordExpire?: Date
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: [true, 'Tên là bắt buộc'], trim: true },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    password: { type: String, required: [true, 'Mật khẩu là bắt buộc'], minlength: [6, 'Mật khẩu ít nhất 6 ký tự'] },
    role: { type: String, enum: [UserRole.Customer, UserRole.Barber, UserRole.Admin], default: UserRole.Customer },
    authProvider: {
      type: String,
      enum: [UserAuthProvider.Local, UserAuthProvider.Google, UserAuthProvider.Facebook],
      default: UserAuthProvider.Local
    },
    phone: { type: String, match: [/^0\d{9,10}$/, 'Số điện thoại không hợp lệ (bắt đầu bằng 0, 10-11 số)'] },
    address: {
      street: String,
      district: String,
      city: String,
      country: { type: String, default: 'Vietnam' }
    },
    gender: { type: String, enum: GENDERS },
    verify: {
      type: String,
      enum: [UserVerifyStatus.Unverified, UserVerifyStatus.Verified],
      default: UserVerifyStatus.Unverified
    },
    avatar: String,
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    specialty: String,
    bio: String,
    forgotPasswordToken: String,
    forgotPasswordExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

userSchema.index({ phone: 1 })
userSchema.index({ role: 1 })

export default model<IUser>('User', userSchema)
