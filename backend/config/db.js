import mongoose from 'mongoose'

let connectionPromise

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!mongoUri) throw new Error('MONGODB_URI or MONGO_URI is not configured')
  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongoUri)
      .then(() => {
        console.log('MongoDB connected')
        return mongoose.connection
      })
      .catch(error => {
        connectionPromise = undefined
        throw error
      })
  }
  return connectionPromise
}
