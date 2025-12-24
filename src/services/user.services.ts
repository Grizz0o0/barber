import UserModel from '~/models/user.model'
import { NotFoundError, BadRequestError } from '~/responses/error.response'
import { getInfoData, getSelectData, omitInfoData } from '~/utils/object.utils'
import { createPagination } from '~/responses/success.response'
import RefreshTokenService from '~/services/refreshToken.services'
import { getListUserTypeQuery, getListUserSchema } from '~/requestSchemas/users.request'
import { updateMeReqBodyType, updateMeSchema } from '~/requestSchemas/users.request'
import { ObjectId } from 'mongodb'

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
    select = ['name', 'email', 'phone', 'dateOfBirth', 'gender', 'address', 'avatar']
  }: getListUserTypeQuery) => {
    const validatedQuery = getListUserSchema.query.parse({
      limit,
      page,
      order,
      select
    })

    const skip = ((validatedQuery.page ?? 1) - 1) * (validatedQuery.limit ?? 10)

    const sortField = 'name'
    const sortBy: { [key: string]: 'asc' | 'desc' } = { [sortField]: validatedQuery.order === 'asc' ? 'asc' : 'desc' }

    const totalItems = await UserModel.countDocuments({})
    if (totalItems === 0) throw new NotFoundError('Not found users')

    const users = await UserModel.find()
      .sort(sortBy)
      .skip(skip)
      .select(getSelectData(validatedQuery.select ?? []))
      .limit(validatedQuery.limit ?? 10)
      .lean()

    const pagination = createPagination(validatedQuery.page ?? 1, validatedQuery.limit ?? 10, totalItems)

    return { users, pagination }
  }

  static deleteUser = async (userId: string | ObjectId) => {
    const [delUser, delToken] = await Promise.all([
      UserModel.findByIdAndDelete(userId),
      RefreshTokenService.deleteByUserId(userId)
    ])
    if (!delUser || !delToken) throw new BadRequestError('Delete user or token fail')

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
        $set: { ...validatedData }
      },
      { new: true }
    )
    return omitInfoData({
      fields: ['verify', 'authProvider', 'verifyEmailToken', 'forgotPasswordToken', 'password'],
      object: result
    })
  }
}

export default UserService
