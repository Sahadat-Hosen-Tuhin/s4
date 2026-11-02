import { Router } from 'express'
import { createRequest, listRequests, decideRequest } from '../controllers/requests.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
const router = Router()
router.get('/', requireAuth, listRequests)
router.post('/', requireAuth, requireRole('employee'), createRequest)
router.patch('/:id/decision', requireAuth, requireRole('admin'), decideRequest)
export default router
