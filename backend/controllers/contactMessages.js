import { z } from 'zod'
import ContactMessage from '../models/ContactMessage.js'

const contactMessageInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().max(160).optional().default(''),
  message: z.string().trim().min(1).max(5000),
})

export async function createContactMessage(req, res) {
  const parsed = contactMessageInput.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues.map(issue => issue.message).join(', ') })
  }

  const contactMessage = await ContactMessage.create(parsed.data)
  return res.status(201).json({ data: { id: contactMessage._id } })
}

export async function listContactMessages(req, res) {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean()
  return res.json({ data: messages })
}

export async function markContactMessageRead(req, res) {
  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status: 'read' },
    { returnDocument: 'after', runValidators: true },
  )
  if (!message) return res.status(404).json({ message: 'Contact message not found' })
  return res.json({ data: message })
}
