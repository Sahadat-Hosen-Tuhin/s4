import Sale from '../models/Sale.js'

export async function createSale(req, res) {
  const { customerName, amount, status = 'paid', note = '' } = req.body
  if (!customerName || !Number.isFinite(Number(amount)) || Number(amount) < 0 || !['pending', 'paid', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Customer name, a valid amount, and a supported status are required' })
  }
  const sale = await Sale.create({ customerName: customerName.trim(), amount: Number(amount), status, note })
  return res.status(201).json({ data: sale })
}
