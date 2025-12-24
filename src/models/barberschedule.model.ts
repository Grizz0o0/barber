import { Schema, model, Document, Types } from 'mongoose'

interface IBarberSchedule extends Document {
  barber: Types.ObjectId
  dayOfWeek: number
  startTime: string
  endTime: string
  isDayOff: boolean
  isDeleted: boolean
  deletedAt?: Date
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  deletedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const barberScheduleSchema = new Schema<IBarberSchedule>(
  {
    barber: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Barber là bắt buộc'] },
    dayOfWeek: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6], required: [true, 'Ngày trong tuần là bắt buộc'] },
    startTime: {
      type: String,
      required: [true, 'Giờ bắt đầu là bắt buộc'],
      match: [/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Định dạng giờ không hợp lệ (HH:MM)']
    },
    endTime: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc'],
      match: [/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Định dạng giờ không hợp lệ (HH:MM)']
    },
    isDayOff: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

barberScheduleSchema.index({ barber: 1, dayOfWeek: 1 }, { unique: true })
barberScheduleSchema.index({ barber: 1 })

export default model<IBarberSchedule>('BarberSchedule', barberScheduleSchema)
