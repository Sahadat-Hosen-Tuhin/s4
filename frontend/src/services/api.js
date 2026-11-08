import axios from 'axios'
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const api = axios.create({ baseURL, withCredentials: true })
let pendingRequests = 0
const loadingListeners = new Set()
const notifyLoadingListeners = () => loadingListeners.forEach(listener => listener())
export const subscribeToApiLoading = listener => { loadingListeners.add(listener); return () => loadingListeners.delete(listener) }
export const getApiLoadingSnapshot = () => pendingRequests > 0
const finishLoadingRequest = config => {
  if (!config?.__loadingTracked || config.__loadingFinished) return
  config.__loadingFinished = true
  pendingRequests = Math.max(0, pendingRequests - 1)
  notifyLoadingListeners()
}

api.interceptors.request.use(config => {
  config.__loadingTracked = true
  config.__loadingFinished = false
  pendingRequests += 1
  notifyLoadingListeners()
  return config
})
api.interceptors.response.use(
  response => { finishLoadingRequest(response.config); return response },
  error => {
    finishLoadingRequest(error.config)
    const message = error.response?.data?.message || 'Request failed. Please try again.'
    return Promise.reject(new Error(message))
  },
)
export function getImage(url) { return url || '' }
export function normalizeWhatsApp(value) { const number = String(value || '').replace(/\D/g, ''); return number.length >= 10 && number.length <= 15 ? number : '' }
export function whatsappLink(message, number = import.meta.env.VITE_WHATSAPP_NUMBER) { const normalized = normalizeWhatsApp(number); return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : '' }
