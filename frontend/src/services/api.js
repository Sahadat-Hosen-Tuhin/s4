import axios from 'axios'
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const api = axios.create({ baseURL, withCredentials: true })
api.interceptors.response.use(response => response, error => { const message = error.response?.data?.message || 'Request failed. Please try again.'; return Promise.reject(new Error(message)) })
export function getImage(url) { return url || '' }
export function whatsappLink(message) { const number = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, ''); return `https://wa.me/${number}?text=${encodeURIComponent(message)}` }
