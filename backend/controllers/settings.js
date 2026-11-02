import Settings from '../models/Settings.js'
import { normalizePhone } from '../utils/phone.js'

export async function getSettings(req, res) {
  const settings = await Settings.findOne({ key: 'business' }).lean() || {}
  const enabledPaymentMethods = settings.enabledPaymentMethods || []
  const merchantAccounts = enabledPaymentMethods.reduce((accounts, method) => ({ ...accounts, [method]: settings.merchantAccounts?.[method] || '' }), {})
  res.json({ data: { ...settings, whatsappNumber: normalizePhone(settings.whatsappNumber || '8801677105126'), merchantAccounts, enabledPaymentMethods, defaultDeliveryCharge: settings.defaultDeliveryCharge || 0, defaultAdvanceAmount: settings.defaultAdvanceAmount || 0 } })
}

export async function updateSettings(req, res) {
  const body = req.body || {}
  const methods = Array.isArray(body.enabledPaymentMethods) ? body.enabledPaymentMethods.filter(x => ['bKash', 'Nagad', 'Rocket'].includes(x)) : []
  const delivery = Number(body.defaultDeliveryCharge)
  const advance = Number(body.defaultAdvanceAmount)
  if (!Number.isFinite(delivery) || delivery < 0 || !Number.isFinite(advance) || advance < 0) return res.status(400).json({ message: 'Delivery and advance amounts must be valid non-negative numbers' })
  if (advance > delivery && delivery > 0) return res.status(400).json({ message: 'Advance amount cannot exceed the delivery charge' })
  const settings = await Settings.findOneAndUpdate({ key: 'business' }, { key: 'business', whatsappNumber: normalizePhone(body.whatsappNumber) || '8801677105126', merchantAccounts: body.merchantAccounts || {}, enabledPaymentMethods: methods, deliveryCharges: body.deliveryCharges || {}, defaultDeliveryCharge: delivery, defaultAdvanceAmount: advance }, { upsert: true, returnDocument: 'after', runValidators: true })
  res.json({ data: settings })
}
