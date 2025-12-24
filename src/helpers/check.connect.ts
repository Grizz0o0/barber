import mongoose from 'mongoose'
import os from 'os'
import process from 'process'

const _SECOND: number = 5000

// Count connected
export const countConnect = (): void => {
  const numConnection: number = mongoose.connections.length
  console.log(`Number of connections: ${numConnection}`)
}

// Check overload
export const checkOverload = (): void => {
  setInterval(() => {
    // Lấy số lượng kết nối hiện tại
    const numConnection: number = mongoose.connections.length

    // Lấy thông tin hệ thống
    const numCores: number = os.cpus().length
    const memoryUsage: number = process.memoryUsage().rss

    // Example maximum number of connections based on number of cores
    const maxConnections: number = numCores * 5

    console.log(`Active connections: ${numConnection}`)
    console.log(`Memory usage: ${memoryUsage / 1024 / 1024} MB`)

    if (numConnection > maxConnections) {
      console.log('Connection overload detected !')
      // notify.send(...)
    }
  }, _SECOND) // Monitor every 5 seconds
}
