import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'business' },
  whatsappNumber: { type: String, default: '8801677105126', trim: true },
  merchantAccounts: {
    bKash: { type: String, default: '', trim: true },
    nagad: { type: String, default: '', trim: true },
    rocket: { type: String, default: '', trim: true },
  },
  enabledPaymentMethods: { type: [String], enum: ['bKash', 'Nagad', 'Rocket'], default: [] },
  deliveryCharges: { type: mongoose.Schema.Types.Mixed, default: {} },
  defaultDeliveryCharge: { type: Number, min: 0, default: 0 },
  defaultAdvanceAmount: { type: Number, min: 0, default: 0 },
}, { timestamps: true })

export default mongoose.model('Settings', settingsSchema)
