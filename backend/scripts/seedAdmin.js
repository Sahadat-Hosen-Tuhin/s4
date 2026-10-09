import 'dotenv/config'
import mongoose from 'mongoose'
import argon2 from 'argon2'
import Admin from '../models/Admin.js'
import { connectDatabase } from '../config/db.js'
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first')
await connectDatabase()
const passwordHash = await argon2.hash(process.env.ADMIN_PASSWORD)
await Admin.findOneAndUpdate({ email: process.env.ADMIN_EMAIL.toLowerCase() }, { email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash }, { upsert: true, new: true })
console.log('Admin account is ready')
await mongoose.disconnect()
