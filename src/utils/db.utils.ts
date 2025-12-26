export const notDeleted = { isDeleted: false }

export const active = { isActive: true }

export const validUser = { ...notDeleted, ...active }

export const getNotDeletedFilter = (filter: any = {}) => {
  return {
    ...filter,
    isDeleted: false
  }
}
