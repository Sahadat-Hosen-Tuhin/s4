import mongoose from 'mongoose'

const paymentEntrySchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank transfer', 'Other'], required: true },
  transactionId: { type: String, trim: true, maxlength: 120, default: '' },
  note: { type: String, trim: true, maxlength: 500, default: '' },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  receivedAt: { type: Date, default: Date.now },
})

const paymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['bKash', 'Nagad', 'Rocket', null], default: null },
  merchantNumber: { type: String, default: '' },
  senderNumber: { type: String, default: '' },
  transactionId: { type: String, trim: true, maxlength: 120, default: '' },
  screenshot: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  status: { type: String, enum: ['unpaid', 'submitted', 'partial', 'paid', 'verified', 'rejected', 'refunded'], default: 'unpaid' },
  paidAmount: { type: Number, min: 0, default: 0 },
  payments: { type: [paymentEntrySchema], default: [] },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  verifiedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  reference: { type: String, unique: true, required: true, index: true },
  postType: { type: String, enum: ['products', 'packages'], required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  customer: {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    address: { type: String, default: '', maxlength: 500 },
    district: { type: String, default: '', maxlength: 100 },
    area: { type: String, default: '', maxlength: 100 },
  },
  quantity: { type: Number, min: 1, default: 1 },
  options: { type: mongoose.Schema.Types.Mixed, default: {} },
  pricing: {
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharge: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  payment: { type: paymentSchema, default: () => ({}) },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'], default: 'pending' },
  statusHistory: [{ status: String, changedBy: mongoose.Schema.Types.ObjectId, changedAt: Date, note: String }],
}, { timestamps: true })

orderSchema.index({ employeeId: 1, createdAt: -1 })
orderSchema.index({ status: 1, 'payment.status': 1, createdAt: -1 })

export default mongoose.model('Order', orderSchema)
