import { ObjectId } from 'mongodb'

const convertToObjectId = (id: string) => {
  return new ObjectId(id)
}

function isValidObjectId(id: string) {
  return ObjectId.isValid(id)
}

export { convertToObjectId, isValidObjectId }
