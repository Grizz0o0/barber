import mongoose from 'mongoose'
import config from '../config/mongodb.config'
import { countConnect } from '../helpers/check.connect'
import envConfig from '../config/env.config'

const { name, databaseUrl } = config.database
const connectString = databaseUrl || `mongodb://localhost:27017/${name}`

class Database {
  private static instance: Database

  private constructor() {}

  // Phương thức kết nối
  public connect(type: string = 'mongodb'): Promise<typeof mongoose> {
    // Enable debug mode trong môi trường development
    if (envConfig.NODE_ENV === 'dev') {
      mongoose.set('debug', true)
      mongoose.set('debug', { color: true })
    }

    return mongoose
      .connect(connectString, {
        maxPoolSize: 50
      })
      .then((mongooseInstance) => {
        console.log(`Connected MongoDB Success: ${name}`)
        countConnect()
        return mongooseInstance
      })
      .catch((err) => {
        console.error('Error Connect:', err)
        throw err
      })
  }

  // Singleton Pattern
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }
}

const instanceMongodb = Database.getInstance()
export default instanceMongodb
