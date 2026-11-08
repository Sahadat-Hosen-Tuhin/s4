import mongoose from 'mongoose'

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  subject: { type: String, trim: true, maxlength: 160, default: '' },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['new', 'read'], default: 'new' },
}, { timestamps: true })

contactMessageSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('ContactMessage', contactMessageSchema)
