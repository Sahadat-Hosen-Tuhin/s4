import { Router } from 'express'
import { calculateOrder, createOrder, listOrders, orderDetail, updateOrder } from '../controllers/orders.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { optionalPaymentScreenshot } from '../middleware/optionalUpload.js'
const router = Router()
router.post('/calculate', calculateOrder)
router.post('/', optionalPaymentScreenshot, createOrder)
router.get('/', requireAuth, listOrders)
router.get('/:id', requireAuth, orderDetail)
router.patch('/:id', requireAuth, requireRole('admin'), updateOrder)
export default router
