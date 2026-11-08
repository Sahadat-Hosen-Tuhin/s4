import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createContactMessage, listContactMessages, markContactMessageRead } from '../controllers/contactMessages.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
const submissionLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false })

router.post('/', submissionLimit, createContactMessage)
router.get('/', requireAuth, requireRole('admin'), listContactMessages)
router.patch('/:id/read', requireAuth, requireRole('admin'), markContactMessageRead)

export default router
