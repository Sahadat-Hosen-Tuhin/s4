import { Router } from 'express'
import { list, detail, create, update, remove } from '../controllers/content.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadImages } from '../middleware/upload.js'
export function contentRoutes(type) { const router = Router(); router.get('/', (req, res, next) => req.query.includeUnpublished === 'true' ? requireAuth(req, res, next) : next(), list(type)); router.get('/admin/:id', requireAuth, detail(type, true)); router.get('/:slug', detail(type)); router.post('/', requireAuth, uploadImages, create(type)); router.put('/:id', requireAuth, uploadImages, update(type)); router.delete('/:id', requireAuth, remove(type)); return router }
