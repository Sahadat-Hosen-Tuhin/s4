import { Router } from 'express'
import { login, logout, me } from '../controllers/auth.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.post('/login', login); router.get('/me', requireAuth, me); router.post('/logout', logout)
export default router
