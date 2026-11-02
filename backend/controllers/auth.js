import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import Employee from '../models/Employee.js'
async function authenticate(model, email, password) { const account = await model.findOne({ email: email.toLowerCase().trim() }); if (!account || account.isActive === false || !(await argon2.verify(account.passwordHash, password))) return null; return account }
function setSession(res, account, role) { const token = jwt.sign({ id: account._id.toString(), email: account.email, role, permissions: role === 'employee' ? account.permissions : undefined }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }); res.cookie('s4_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 24 * 60 * 60 * 1000 }); res.json({ data: { email: account.email, role, name: account.name || '' } }) }
export async function login(req, res) { const { email, password } = req.body || {}; if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) return res.status(400).json({ message: 'Email and password are required' }); const admin = await authenticate(Admin, email, password); if (!admin) return res.status(401).json({ message: 'Invalid email or password' }); setSession(res, admin, 'admin') }
export async function employeeLogin(req, res) { const { email, password } = req.body || {}; if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) return res.status(400).json({ message: 'Email and password are required' }); const employee = await authenticate(Employee, email, password); if (!employee) return res.status(401).json({ message: 'Invalid email or password' }); setSession(res, employee, 'employee') }
export function me(req, res) { res.json({ data: req.admin }) }
export function logout(req, res) { res.clearCookie('s4_token'); res.json({ data: null }) }
