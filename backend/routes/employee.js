import { Router } from 'express'
import { employeeProfile, updateProfile } from '../controllers/employees.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
const router = Router()
router.use(requireAuth, requireRole('employee'))
router.get('/profile', employeeProfile)
router.put('/profile', updateProfile)
export default router
