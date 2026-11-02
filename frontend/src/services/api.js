import axios from 'axios'
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const api = axios.create({ baseURL, withCredentials: true })
api.interceptors.response.use(response => response, error => { const message = error.response?.data?.message || 'Request failed. Please try again.'; return Promise.reject(new Error(message)) })
export function getImage(url) { return url || '' }
export function normalizeWhatsApp(value) { const number = String(value || '').replace(/\D/g, ''); return number.length >= 10 && number.length <= 15 ? number : '' }
export function whatsappLink(message, number = import.meta.env.VITE_WHATSAPP_NUMBER) { const normalized = normalizeWhatsApp(number); return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : '' }
