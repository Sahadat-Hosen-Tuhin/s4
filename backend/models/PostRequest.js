import mongoose from 'mongoose'

const postRequestSchema = new mongoose.Schema({
  postType: { type: String, enum: ['products', 'packages'], required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, enum: ['edit', 'delete'], required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  proposedChanges: { type: mongoose.Schema.Types.Mixed, default: null },
  reason: { type: String, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  decisionNote: { type: String, trim: true, maxlength: 2000, default: '' },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  decidedAt: { type: Date, default: null },
}, { timestamps: true })

postRequestSchema.index({ status: 1, createdAt: -1 })
postRequestSchema.index({ employeeId: 1, createdAt: -1 })

export default mongoose.model('PostRequest', postRequestSchema)
