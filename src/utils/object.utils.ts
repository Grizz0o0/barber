import * as _ from 'lodash'

const getInfoData = ({ fields = [], object = {} }: { fields: string[]; object: any }) => {
  return _.pick(object, fields)
}

const omitInfoData = ({ fields = [], object = {} }: { fields: string[]; object: any }) => {
  return _.omit(object, fields)
}

//['a','b'] => {a: 1, b: 1}
const getSelectData = (select: string[]) => {
  return Object.fromEntries(select.map((e) => [e, 1]))
}

//['a','b'] => {a: 0, b: 0}
const unSelectData = (select: string[]) => {
  return Object.fromEntries(select.map((e) => [e, 0]))
}

// { a: 1, b: undefined, c: 3 } => { a: 1, c: 3 }
function cleanUndefined<T extends object>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined && value !== null)
  ) as Partial<T>
}

function deepCleanUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deepCleanUndefined).filter((item) => item !== undefined && item !== null)
  } else if (obj && typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, deepCleanUndefined(v)])
    )
  }
  return obj
}

export { getInfoData, omitInfoData, getSelectData, unSelectData, cleanUndefined, deepCleanUndefined }
