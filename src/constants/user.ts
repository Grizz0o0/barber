export enum UserRole {
  Customer = 'customer',
  Barber = 'barber',
  Admin = 'admin'
}

export enum UserVerifyStatus {
  Unverified = 'unverified',
  Verified = 'verified',
  Banned = 'banned'
}

export enum UserAuthProvider {
  Local = 'local',
  Google = 'google',
  Facebook = 'facebook'
}

export const GENDERS = ['male', 'female', 'other'] as const
export type Gender = (typeof GENDERS)[number]
