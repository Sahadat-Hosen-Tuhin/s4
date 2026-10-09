import mongoose from 'mongoose'
const saleSchema = new mongoose.Schema({ customerName: { type: String, required: true, trim: true }, amount: { type: Number, required: true, min: 0 }, status: { type: String, enum: ['pending', 'paid', 'completed', 'cancelled'], default: 'pending' }, note: String }, { timestamps: true })
export default mongoose.model('Sale', saleSchema)
