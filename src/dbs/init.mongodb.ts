import mongoose from 'mongoose'
import config from '../config/mongodb.config'
import { countConnect } from '../helpers/check.connect'
import envConfig from '../config/env.config'

const { name, databaseUrl } = config.database
const connectString = databaseUrl || `mongodb://localhost:27017/${name}`

class Database {
  private static instance: Database

  private constructor() {
    this.connect()
  }

  // Phương thức kết nối
  private connect(type: string = 'mongodb'): void {
    // Enable debug mode trong môi trường development
    if (envConfig.NODE_ENV === 'dev') {
      mongoose.set('debug', true)
      mongoose.set('debug', { color: true })
    }

    mongoose
      .connect(connectString, {
        maxPoolSize: 50
      })
      .then(() => {
        console.log(`Connected MongoDB Success: ${name}`)
        countConnect()
      })
      .catch((err) => {
        console.error('Error Connect:', err)
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
