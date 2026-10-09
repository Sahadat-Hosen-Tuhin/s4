import mongoose from 'mongoose'
const imageSchema = new mongoose.Schema({ url: { type: String, required: true }, publicId: { type: String, required: true } }, { _id: false })
const productSchema = new mongoose.Schema({ name: { type: String, required: true, trim: true, maxlength: 140 }, slug: { type: String, required: true, unique: true }, description: { type: String, trim: true, maxlength: 5000 }, category: { type: String, required: true, trim: true }, price: { type: Number, required: true, min: 0 }, discountPrice: { type: Number, min: 0 }, images: { type: [imageSchema], default: [] }, stock: { type: Number, required: true, min: 0, default: 0 }, isPublished: { type: Boolean, default: false } }, { timestamps: true })
productSchema.index({ name: 'text', description: 'text' })
export default mongoose.model('Product', productSchema)
