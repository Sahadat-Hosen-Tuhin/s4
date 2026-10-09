import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { connectDatabase } from './config/db.js'
import authRoutes from './routes/auth.js'
import { contentRoutes } from './routes/content.js'
import { dashboard } from './controllers/dashboard.js'
import { createSale } from './controllers/sales.js'
import { requireAuth } from './middleware/auth.js'
import { notFound, errorHandler } from './middleware/error.js'

const app = express()
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters')
}
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }))
app.use('/api/auth', authRoutes)
app.use('/api/products', contentRoutes('products'))
app.use('/api/packages', contentRoutes('packages'))
app.get('/api/admin/dashboard', requireAuth, dashboard)
app.post('/api/admin/sales', requireAuth, createSale)
app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || 5000
connectDatabase()
  .then(() => app.listen(port, () => console.log(`S4 API listening on http://localhost:${port}`)))
  .catch(error => {
    console.error(`Database startup failed: ${error.message}`)
    process.exit(1)
  })