import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema({
  whatsapp: { type: String, trim: true, default: '' },
  bKash: { type: String, trim: true, default: '' },
  nagad: { type: String, trim: true, default: '' },
  rocket: { type: String, trim: true, default: '' },
}, { _id: false })

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  permissions: {
    createPosts: { type: Boolean, default: true },
    submitRequests: { type: Boolean, default: true },
    recordSales: { type: Boolean, default: true },
  },
  contacts: { type: contactSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Employee', employeeSchema)
