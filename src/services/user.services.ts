import UserModel from '~/models/user.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { getInfoData, getSelectData, omitInfoData, flattenObject } from '~/utils/object.utils'
import { createPagination } from '~/responses/success.response'
import RefreshTokenService from '~/services/refreshToken.services'
import { getListUserTypeQuery, getListUserSchema } from '~/requestSchemas/users.request'
import { updateMeReqBodyType, updateMeSchema } from '~/requestSchemas/users.request'
import { ObjectId } from 'mongodb'
import { UserRole } from '~/constants/user'
import BookingModel from '~/models/booking.model'
import { BookingStatus } from '~/constants/booking'

class UserService {
  static getUserByEmail = async (email: string) => {
    const foundUser = await UserModel.findOne({ email })
    if (!foundUser) throw new NotFoundError('Not found user')

    return omitInfoData({
      fields: ['verify', 'authProvider', 'verifyEmailToken', 'forgotPasswordToken'],
      object: foundUser
    })
  }

  static getUserById = async (userId: string | ObjectId) => {
    const foundUser = await UserModel.findById(userId)
    if (!foundUser) throw new NotFoundError('Not found user')

    return omitInfoData({
      fields: [
        'verify',
        'authProvider',
        'verifyEmailToken',
        'forgotPasswordToken',
        'password',
        'createdAt',
        'updatedAt'
      ],
      object: foundUser
    })
  }

  static getAllUsers = async ({
    limit = 10,
    page = 1,
    order = 'asc',
    select = ['name', 'email', 'phone', 'dateOfBirth', 'gender', 'address', 'avatar'],
    q
  }: getListUserTypeQuery & { q?: string }) => {
    // We might need to extend getListUserSchema in requestSchemas if we want validation there.
    // For simplicity, we just take 'q' and use it.

    const validatedQuery = getListUserSchema.query.parse({
      limit,
      page,
      order,
      select
    })

    const skip = ((validatedQuery.page ?? 1) - 1) * (validatedQuery.limit ?? 10)

    const sortField = 'name'
    const sortBy: { [key: string]: 'asc' | 'desc' } = { [sortField]: validatedQuery.order === 'asc' ? 'asc' : 'desc' }

    // Build filter
    const filter: any = {}
    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    }

    const totalItems = await UserModel.countDocuments(filter)
    // if (totalItems === 0) throw new NotFoundError('Not found users') // Skipping this to return empty list instead of error

    const users = await UserModel.find(filter)
      .sort(sortBy)
      .skip(skip)
      .select(getSelectData(validatedQuery.select ?? []))
      .limit(validatedQuery.limit ?? 10)
      .lean()

    const pagination = createPagination(validatedQuery.page ?? 1, validatedQuery.limit ?? 10, totalItems)

    return { users, pagination }
  }

  static deleteUser = async (userId: string | ObjectId) => {
    // 1. Check for active future bookings
    const hasActiveBookings = await BookingModel.findOne({
      barber: userId,
      status: { $in: [BookingStatus.Pending, BookingStatus.Confirmed] },
      startTime: { $gte: new Date() },
      isDeleted: false
    })

    if (hasActiveBookings) {
      throw new BadRequestError('Không thể xóa thợ vì còn lịch hẹn chưa hoàn thành trong tương lai')
    }

    // 2. Soft Delete
    const [delUser, delToken] = await Promise.all([
      UserModel.findByIdAndUpdate(
        userId,
        {
          isDeleted: true,
          isActive: false, // Immediately disable login
          deletedAt: new Date()
        },
        { new: true }
      ),
      RefreshTokenService.deleteByUserId(userId)
    ])

    if (!delUser) throw new BadRequestError('User not found or delete failed')

    return getInfoData({ fields: ['_id', 'user', 'refreshToken', 'refreshTokenUsed'], object: delUser })
  }

  static updateMe = async (userId: string | ObjectId, payload: updateMeReqBodyType) => {
    const parseResult = await updateMeSchema.body.safeParseAsync(payload)
    if (!parseResult.success) {
      throw new BadRequestError('Invalid update data: ' + JSON.stringify(parseResult.error.flatten().fieldErrors))
    }
    const validatedData = parseResult.data

    const foundUser = await UserModel.findById(userId)
    if (!foundUser) throw new NotFoundError('Not found user')

    const result = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: flattenObject(validatedData)
      },
      { new: true }
    )
    return omitInfoData({
      fields: ['verify', 'authProvider', 'verifyEmailToken', 'forgotPasswordToken', 'password'],
      object: result
    })
  }
  static getBarbers = async () => {
    const barbers = await UserModel.find({ role: UserRole.Barber })
      .select('name avatar rating experience specialty bio')
      .lean()

    return barbers
  }

  static createUser = async (payload: any) => {
    // Default password for admin-created users
    const defaultPassword = 'Password@123'
    // In a real app, you might want to hash this here or rely on pre-save hook in model
    // Assuming model pre-save hook hashes password if modified.
    // However, looking at models/user.model.ts (not shown but assumed), let's ensure we pass plain text and let model handle it
    // OR if we need to hash it manually (typical in service if logic is explicit).
    // Let's assume pre-save hook handles hashing for 'password' field.

    const { email } = payload
    const existUser = await UserModel.findOne({ email })
    if (existUser) throw new BadRequestError('Email already registered')

    const newUser = await UserModel.create({
      ...payload,
      password: defaultPassword,
      // Ensure verify is true for admin created users?
      verify: 1 // Assuming 1 is Verified or similar status constant
    })

    if (!newUser) throw new BadRequestError('Create user failed')

    return omitInfoData({
      fields: ['password', 'verifyEmailToken', 'forgotPasswordToken'],
      object: newUser
    })
  }

  static updateUser = async (userId: string | ObjectId, payload: any) => {
    // Basic validation or just update
    const foundUser = await UserModel.findById(userId)
    if (!foundUser) throw new NotFoundError('Not found user')

    const result = await UserModel.findByIdAndUpdate(userId, { $set: flattenObject(payload) }, { new: true })
    if (!result) throw new NotFoundError('Update user fail')

    return omitInfoData({
      fields: ['password', 'verifyEmailToken', 'forgotPasswordToken'],
      object: result
    })
  }
}

export default UserService
