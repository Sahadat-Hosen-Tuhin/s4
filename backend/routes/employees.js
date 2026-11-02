import { Router } from 'express'
import { createEmployee, listEmployees, updateEmployee, employeeProfile, updateProfile } from '../controllers/employees.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
const router = Router()
router.use(requireAuth, requireRole('admin'))
router.post('/', createEmployee)
router.get('/', listEmployees)
router.put('/:id', updateEmployee)
export default router
