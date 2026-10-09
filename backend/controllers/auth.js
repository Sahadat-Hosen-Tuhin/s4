import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
export async function login(req, res) { const { email, password } = req.body || {}; if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) return res.status(400).json({ message: 'Email and password are required' }); const admin = await Admin.findOne({ email: email.toLowerCase().trim() }); if (!admin || !(await argon2.verify(admin.passwordHash, password))) return res.status(401).json({ message: 'Invalid email or password' }); const token = jwt.sign({ id: admin._id.toString(), email: admin.email, role: admin.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }); res.cookie('s4_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 24 * 60 * 60 * 1000 }); res.json({ data: { email: admin.email } }) }
export function me(req, res) { res.json({ data: req.admin }) }
export function logout(req, res) { res.clearCookie('s4_token'); res.json({ data: null }) }
