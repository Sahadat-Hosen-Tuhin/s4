import crypto from 'crypto'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import TravelPackage from '../models/Package.js'
import Settings from '../models/Settings.js'
import { uploadBuffer } from '../utils/cloudinary.js'
import { normalizePhone } from '../utils/phone.js'

const modelFor = type => type === 'products' ? Product : type === 'packages' ? TravelPackage : null
const makeReference = () => `S4-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
const parseJson = value => { if (typeof value !== 'string') return value || {}; try { return JSON.parse(value) } catch { return {} } }

export async function calculateOrder(req, res) {
  const Model = modelFor(req.body?.postType)
  if (!Model) return res.status(400).json({ message: 'Invalid post type' })
  const post = await Model.findOne({ _id: req.body.postId, isPublished: true }).lean()
  if (!post) return res.status(404).json({ message: 'Post not found' })
  const quantity = Math.max(1, Math.min(99, Number(req.body.quantity) || 1))
  const unitPrice = Number(post.discountPrice || post.price)
  const settings = await Settings.findOne({ key: 'business' }).lean() || {}
  const deliveryCharge = postType(req.body.postType) === 'products' ? Number(settings.deliveryCharges?.[req.body.district] ?? settings.defaultDeliveryCharge ?? 0) : 0
  const advanceAmount = Math.min(Number(settings.defaultAdvanceAmount || 0), deliveryCharge)
  const subtotal = unitPrice * quantity
  const enabledPaymentMethods = post.contact?.paymentMethods?.length ? post.contact.paymentMethods : settings.enabledPaymentMethods || []
  const merchantAccounts = enabledPaymentMethods.reduce((accounts, method) => ({ ...accounts, [method]: post.contact?.paymentAccounts?.[method] || settings.merchantAccounts?.[method] || '' }), {})
  res.json({ data: { unitPrice, quantity, subtotal, deliveryCharge, advanceAmount, remainingAmount: subtotal + deliveryCharge - advanceAmount, total: subtotal + deliveryCharge, enabledPaymentMethods, merchantAccounts } })
}

function postType(value) { return value === 'products' ? 'products' : 'packages' }

export async function createOrder(req, res) {
  const { postType: type, postId, customer, quantity, paymentMethod, senderNumber, transactionId, options } = { ...req.body, customer: parseJson(req.body.customer), options: parseJson(req.body.options) }
  const Model = modelFor(type)
  if (!Model || !customer?.name || !normalizePhone(customer.phone)) return res.status(400).json({ message: 'Post type, customer name, and valid phone are required' })
  const post = await Model.findOne({ _id: postId, isPublished: true }).lean()
  if (!post) return res.status(404).json({ message: 'Post not found' })
  const settings = await Settings.findOne({ key: 'business' }).lean() || {}
  const count = Math.max(1, Math.min(99, Number(quantity) || 1))
  const methods = post.contact?.paymentMethods?.length ? post.contact.paymentMethods : settings.enabledPaymentMethods || []
  if (paymentMethod && !methods.includes(paymentMethod)) return res.status(400).json({ message: 'Selected payment method is not enabled for this post' })
  const payment = paymentMethod || null
  if (payment && (!normalizePhone(senderNumber) || !String(transactionId || '').trim())) return res.status(400).json({ message: 'Sender number and transaction ID are required for manual payment' })
  const unitPrice = Number(post.discountPrice || post.price)
  const deliveryCharge = type === 'products' ? Number(settings.deliveryCharges?.[customer.district] ?? settings.defaultDeliveryCharge ?? 0) : 0
  const advanceAmount = Math.min(Number(settings.defaultAdvanceAmount || 0), deliveryCharge)
  const subtotal = unitPrice * count
  const screenshot = req.file ? await uploadBuffer(req.file, 's4/payment-evidence') : null
  const order = await Order.create({ reference: makeReference(), postType: type, postId, employeeId: post.createdByType === 'employee' ? post.createdBy : null, customer: { ...customer, phone: normalizePhone(customer.phone) }, quantity: count, options, pricing: { unitPrice, subtotal, deliveryCharge, advanceAmount, remainingAmount: subtotal + deliveryCharge - advanceAmount, total: subtotal + deliveryCharge }, payment: { method: payment, merchantNumber: payment ? post.contact?.paymentAccounts?.[payment] || settings.merchantAccounts?.[payment] || '' : '', senderNumber: normalizePhone(senderNumber), transactionId: String(transactionId || '').trim(), screenshot: screenshot || {}, status: payment ? 'submitted' : 'unpaid' }, statusHistory: [{ status: 'pending', changedAt: new Date(), note: 'Order created' }] })
  res.status(201).json({ data: { reference: order.reference, pricing: order.pricing, paymentStatus: order.payment.status } })
}

export async function listOrders(req, res) {
  const query = req.admin.role === 'admin' ? {} : { employeeId: req.admin.id }
  if (req.query.status) query.status = req.query.status
  if (req.query.paymentStatus) query['payment.status'] = req.query.paymentStatus
  const data = await Order.find(query).populate('employeeId', 'name email').sort({ createdAt: -1 }).limit(200)
  res.json({ data })
}

export async function orderDetail(req, res) {
  const query = req.admin.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, employeeId: req.admin.id }
  const data = await Order.findOne(query).populate('employeeId', 'name email')
  if (!data) return res.status(404).json({ message: 'Order not found' })
  res.json({ data })
}

export async function updateOrder(req, res) {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })
  const { status, paymentStatus, rejectionReason, note } = req.body || {}
  if (status && !['pending', 'confirmed', 'completed', 'cancelled', 'refunded'].includes(status)) return res.status(400).json({ message: 'Invalid order status' })
  if (paymentStatus && paymentStatus !== 'rejected') return res.status(400).json({ message: 'Record a payment amount to update payment status' })
  if (paymentStatus === 'rejected' && order.payment.status !== 'submitted') return res.status(400).json({ message: 'Only submitted payment evidence can be rejected' })
  if (status) { order.status = status; order.statusHistory.push({ status, changedBy: req.admin.id, changedAt: new Date(), note: String(note || '') }) }
  if (paymentStatus) { order.payment.status = paymentStatus; order.payment.rejectionReason = String(rejectionReason || '') }
  await order.save()
  res.json({ data: order })
}

export async function recordOrderPayment(req, res) {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })

  const amount = Number(req.body?.amount)
  const method = String(req.body?.method || '')
  const transactionId = String(req.body?.transactionId || '').trim()
  const note = String(req.body?.note || '').trim()
  const allowedMethods = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank transfer', 'Other']
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.0001) return res.status(400).json({ message: 'Enter a valid payment amount greater than zero (up to 2 decimal places)' })
  if (!allowedMethods.includes(method)) return res.status(400).json({ message: 'Select a valid payment method' })
  if (transactionId.length > 120 || note.length > 500) return res.status(400).json({ message: 'Transaction ID or note is too long' })
  if (order.payment.status === 'refunded') return res.status(400).json({ message: 'Cannot record a payment for a refunded order' })

  const total = Number(order.pricing.total)
  const historicalVerified = order.payment.status === 'verified' && !order.payment.payments.length && !order.payment.paidAmount
  const currentPaid = historicalVerified ? total : Number(order.payment.paidAmount || 0)
  const remaining = Math.max(0, total - currentPaid)
  if (amount > remaining + 0.001) return res.status(400).json({ message: `Payment exceeds the remaining balance of ${remaining}` })

  const paidAmount = Math.round((currentPaid + amount) * 100) / 100
  order.payment.payments.push({ amount, method, transactionId, note, receivedBy: req.admin.id })
  order.payment.paidAmount = paidAmount
  order.payment.status = paidAmount >= total ? 'paid' : 'partial'
  order.payment.rejectionReason = ''
  order.payment.verifiedBy = req.admin.id
  order.payment.verifiedAt = new Date()
  await order.save()
  res.status(201).json({ data: order })
}
