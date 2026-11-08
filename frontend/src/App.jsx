/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Loader2, LogIn, LogOut, Mail, MapPin, Menu, MessageCircle, Pause, Pencil, Play, Plus, Search, Send, ShoppingBag, ShoppingCart, Trash2, Upload } from 'lucide-react'
import { api, getApiLoadingSnapshot, getImage, subscribeToApiLoading, whatsappLink } from './services/api'
import './App.css'

const categories = ['Shoes', 'Dresses', 'Borkha / Abaya', 'Dress Lace', 'Cosmetics', 'Other']
const landingCategories = [
  { name: 'Shoes', image: '/images/category.shoes.png', copy: 'Sneakers that move with you. Comfortable, durable, and always in style.', action: 'Find your fit' },
  { name: 'Dresses', image: '/images/category.dress.png', copy: 'Fresh styles for every occasion, made to feel like you.', action: 'Explore dresses' },
  { name: 'Borkha / Abaya', image: '/images/Category.abaya.png', copy: 'Elegant everyday pieces, thoughtfully chosen for your wardrobe.', action: 'Explore abayas' },
  { name: 'Dress Lace', image: '/images/category.lace.png', copy: 'Beautiful finishing details to make every look your own.', action: 'Discover lace' },
  { name: 'Cosmetics', image: '/images/Category.cosmetics.png', copy: 'Everyday beauty picks to refresh your routine.', action: 'Shop cosmetics' },
  { name: 'Other', image: '/images/category.others.png', copy: 'More thoughtful finds, selected just for you.', action: 'See more' },
]
const providers = ['S Alam Tours & Travels', 'S Alam Hajj Kafela']
const CartContext = createContext(null)

function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('s4-cart') || '[]')
      return Array.isArray(saved) ? saved.filter(item => item?._id && Number(item.quantity) > 0) : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('s4-cart', JSON.stringify(items))
    } catch (error) {
      console.error('Unable to save shopping cart:', error)
    }
  }, [items])
  const addToCart = item => {
    if (!item?._id || item.stock < 1) return 'unavailable'
    const existing = items.find(line => line._id === item._id)
    if (existing?.quantity >= item.stock) return 'max'
    setItems(existing
      ? items.map(line => line._id === item._id ? { ...line, quantity: line.quantity + 1, stock: item.stock } : line)
      : [...items, { ...item, quantity: 1 }])
    return 'added'
  }
  const setQuantity = (id, quantity) => setItems(current => current.map(item => item._id === id ? { ...item, quantity: Math.max(1, Math.min(item.stock, Number(quantity) || 1)) } : item))
  const removeFromCart = id => setItems(current => current.filter(item => item._id !== id))
  const cartCount = items.reduce((count, item) => count + item.quantity, 0)
  return <CartContext.Provider value={{ items, cartCount, addToCart, setQuantity, removeFromCart }}>{children}</CartContext.Provider>
}

function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart must be used within CartProvider')
  return cart
}

function Logo({ image = false }) { return <Link className="logo" to="/">{image ? <img className="brand-logo-image" src="/s4%20logo.png" alt="S4 Style & Journeys" /> : <><span>S4</span><small>STYLE & JOURNEYS</small></>}</Link> }
function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { cartCount } = useCart()
  useEffect(() => {
    const root = document.querySelector('.app-shell')
    if (!root) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = !reducedMotion && 'IntersectionObserver' in window
      ? new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }), { threshold: 0.05, rootMargin: '0px' })
      : null
    const observe = element => {
      if (!(element instanceof HTMLElement) || element.dataset.scrollObserved) return
      if (element.closest('.featured-collection, .recommended-collections, .journey-section, .featured-packages-section, .products-page')) return
      element.dataset.scrollObserved = 'true'
      element.classList.add('scroll-reveal')
      if (element.dataset.revealDirection) element.classList.add(`reveal-${element.dataset.revealDirection}`)
      if (observer) observer.observe(element)
      else element.classList.add('is-visible')
    }
    const scan = node => {
      const selector = '.landing-page > section:not(.hero-section):not(.home-about-section):not(.category-scroll-section):not(.featured-collection):not(.recommended-collections):not(.journey-section):not(.featured-packages-section),.card,.provider-card'
      if (node instanceof HTMLElement && node.matches(selector)) observe(node)
      if (node instanceof Element) node.querySelectorAll(selector).forEach(observe)
    }
    scan(root)
    const mutationObserver = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(scan)))
    mutationObserver.observe(root, { childList: true, subtree: true })
    return () => {
      mutationObserver.disconnect()
      observer?.disconnect()
    }
  }, [])
  return <div className="app-shell"><header className="site-header"><div className="container header-inner"><Logo image /><div className="header-actions"><nav className={open ? 'nav open' : 'nav'}><NavLink to="/products" onClick={() => setOpen(false)}>Products</NavLink><NavLink to="/packages" onClick={() => setOpen(false)}>Travel packages</NavLink><NavLink to="/contact" onClick={() => setOpen(false)}>Contact</NavLink></nav><Link className="cart-link" to="/cart" aria-label={`Shopping cart, ${cartCount} items`}><ShoppingCart size={20} /><span className="cart-count">{cartCount}</span></Link><Link className="header-login-link" to="/admin/login" aria-label="Admin login" title="Admin login"><LogIn size={19} /></Link><button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu size={22} /></button></div></div></header>{children}<Footer /></div>
}
function Footer() {
  const whatsapp = whatsappLink('Hello, I would like more information about S4.')
  const socialLinks = [
    { label: 'Facebook', href: '#link', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8.2h2.75l.41-3.2H13.5V7.56c0-.93.26-1.56 1.59-1.56h1.7V3.14c-.3-.04-1.34-.14-2.55-.14-2.52 0-4.24 1.54-4.24 4.37V9.6H7.15v3.2H10V21h3.5Z" /></svg> },
    { label: 'Instagram', href: '#link', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.7" cy="6.7" r="1.1" fill="currentColor" /></svg> },
    { label: 'Email', href: 'mailto:hello@s4.com', icon: <Mail size={17} /> },
  ]
  return <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-brand"><Logo image /><p className="footer-copy">Thoughtful style for every day, and meaningful journeys for wherever life takes you.</p><Link className="footer-contact-cta" to="/contact">We’d love to hear from you <ArrowRight size={15} /></Link><div className="footer-socials" aria-label="Social links">{socialLinks.map(({ label, href, icon }) => <a key={label} href={href} aria-label={label} title={label} {...(label !== 'Email' ? { target: '_blank', rel: 'noreferrer' } : {})}>{icon}</a>)}</div></div>
      <div className="footer-column"><strong>Categories</strong>{categories.map(category => <Link key={category} to={`/products?category=${encodeURIComponent(category)}`}>{category}</Link>)}</div>
      <div className="footer-column"><strong>Explore</strong><Link to="/products">Shop products</Link><Link to="/packages">Travel packages</Link><Link to="/#home-about">About S4</Link><Link to="/cart">Your cart</Link></div>
      <div className="footer-column"><strong>Help & contact</strong><Link to="/contact">Contact us</Link>{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer">Chat on WhatsApp</a>}<a href="mailto:hello@s4.com">hello@s4.com</a></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} S4 Style & Journeys. All rights reserved.</span><span>Made for everyday style and journeys worth remembering.</span></div>
  </footer>
}
function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState(null)
  const [settingsError, setSettingsError] = useState('')
  const loadSettings = useCallback(async () => {
    setSettingsError('')
    try {
      const response = await api.get('/settings')
      setSettings(response.data.data)
    } catch (error) {
      setSettingsError(error.message)
    }
  }, [])
  useEffect(() => { loadSettings() }, [loadSettings])
  const whatsapp = whatsappLink('Hello, I would like to get in touch with S4.', settings?.whatsappNumber)
  const update = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }))
  const submit = async event => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      await api.post('/contact-messages', form)
      setForm({ name: '', email: '', subject: '', message: '' })
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }
  return <Layout><main className="contact-page">
    <section className="contact-hero"><div className="container contact-hero-inner"><span className="eyebrow">We’re here to help</span><h1>Let’s make it personal.</h1><p>Questions about a product, a journey, or an order? We’d love to hear from you.</p><div className="contact-hero-orb" aria-hidden="true" /></div></section>
    <section className="container contact-content" id="contact-options">
      <div className="contact-main"><span className="eyebrow">Send us a note</span><h2>How can we help?</h2><p className="contact-intro">Share a few details and our team will get back to you.</p><form className="contact-form" onSubmit={submit}>
        <div className="contact-form-row"><label className="field"><span>Your name</span><input name="name" value={form.name} onChange={update} autoComplete="name" required /></label><label className="field"><span>Email address</span><input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required /></label></div>
        <label className="field"><span>What is this about? <small>Optional</small></span><input name="subject" value={form.subject} onChange={update} placeholder="Product question, travel package, order..." /></label>
        <label className="field"><span>Your message</span><textarea name="message" value={form.message} onChange={update} rows="6" required placeholder="Tell us how we can help..." /></label>
        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        <button className="btn btn-primary contact-submit" type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Let’s connect'} {!submitting && <Send size={16} />}</button>
      </form></div>
      <aside className="contact-aside"><span className="eyebrow">Get in touch</span><h2>Pick what works for you.</h2><div className="contact-methods">
        <a className="contact-method" href="mailto:hello@s4.com"><span className="contact-method-icon"><Mail size={20} /></span><span><small>Email us</small><strong>hello@s4.com</strong></span><ArrowUpRight size={17} /></a>
        {whatsapp ? <a className="contact-method" href={whatsapp} target="_blank" rel="noreferrer"><span className="contact-method-icon"><MessageCircle size={20} /></span><span><small>Chat on WhatsApp</small><strong>Start a conversation</strong></span><ArrowUpRight size={17} /></a> : <div className="contact-method contact-method-unavailable"><span className="contact-method-icon"><MessageCircle size={20} /></span><span><small>WhatsApp</small><strong>Currently unavailable</strong></span></div>}
        {settingsError && <p className="contact-settings-error" role="status">Could not load contact settings: {settingsError} <button type="button" onClick={loadSettings}>Retry</button></p>}
      </div><div className="contact-note"><span className="contact-note-mark">S4</span><p>Style for the everyday.<br />Journeys to remember.</p></div></aside>
    </section>
    <section className="contact-bottom"><div className="container"><p>Looking for something specific?</p><Link to="/products">Explore products <ArrowRight size={16} /></Link><Link to="/packages">Discover travel packages <ArrowRight size={16} /></Link></div></section>
  </main>{submitted && <div className="modal-backdrop contact-success-backdrop" onClick={() => setSubmitted(false)}><section className="contact-success-modal" role="dialog" aria-modal="true" aria-labelledby="contact-success-title" onClick={event => event.stopPropagation()}><span className="contact-success-icon"><Check size={24} /></span><span className="eyebrow">Message received</span><h2 id="contact-success-title">Thanks for reaching out.</h2><p>Your request has been delivered to our team. We’ll get back to you within 1 hour.</p><button className="btn btn-primary" type="button" onClick={() => setSubmitted(false)}>Got it</button></section></div>}</Layout>
}
function SectionHeading({ eyebrow, title, link, to }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{link && <Link className="text-link" to={to}>{link} <ArrowRight size={16} /></Link>}</div> }
function Image({ src, alt, className = '', loading = 'lazy' }) { return src ? <img className={className} src={getImage(src)} alt={alt} loading={loading} /> : <div className={`image-placeholder ${className}`}><ShoppingBag size={30} /></div> }
function ProductCard({ item, featured = false }) {
  const [orderOpen, setOrderOpen] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const { addToCart } = useCart()
  useEffect(() => {
    if (!cartMessage) return
    const timeout = setTimeout(() => setCartMessage(''), 1800)
    return () => clearTimeout(timeout)
  }, [cartMessage])
  const add = () => {
    const result = addToCart(item)
    setCartMessage(result === 'added' ? 'Added' : result === 'max' ? 'Stock limit reached' : 'Out of stock')
  }
  return <>
    <article className={`card product-card${featured ? ' featured-product-card' : ''}`}>
      <Link className="product-card-link" to={`/products/${item.slug}`}>
        <div className="card-image"><Image src={item.images?.[0]?.url} alt={item.name} /><span className={item.stock > 0 ? 'status in-stock' : 'status'}>{item.stock > 0 ? 'In stock' : 'Unavailable'}</span></div>
        {featured
          ? <div className="card-body"><div className="featured-product-meta"><Price item={item} /><span className="featured-product-category">{item.category}</span></div><h3>{item.name}</h3><p className="featured-product-description">{item.description || 'A thoughtfully selected piece for your everyday collection.'}</p></div>
          : <div className="card-body"><span className="card-kicker">{item.category}</span><h3>{item.name}</h3><Price item={item} /></div>}
      </Link>
      <div className="product-card-actions">
        <button className="btn btn-ghost" type="button" aria-live="polite" disabled={item.stock < 1} onClick={add}>{featured ? null : cartMessage === 'Added' ? <Check size={15} /> : <ShoppingCart size={15} />}{cartMessage || 'Add to cart'}</button>
        <button className="btn btn-primary" type="button" disabled={item.stock < 1} onClick={() => setOrderOpen(true)}>{featured ? 'Buy Now' : <>Order now <ArrowRight size={15} /></>}</button>
      </div>
    </article>
    {orderOpen && <OrderModal item={item} type="products" onClose={() => setOrderOpen(false)} />}
  </>
}
function PackageCard({ item }) { return <Link className="card package-card" to={`/packages/${item.slug}`}><div className="card-image"><Image src={item.images?.[0]?.url} alt={item.title} /><span className="provider-tag">{item.provider === providers[1] ? 'Hajj & Umrah' : 'Tours & Travels'}</span></div><div className="card-body"><span className="card-kicker">{item.duration || 'Flexible itinerary'}</span><h3>{item.title}</h3><p className="muted">{item.provider}</p><strong className="price">From {formatMoney(item.price)}</strong></div></Link> }
function FeaturedCollection({ loading, products }) {
  const sectionRef = useRef(null)
  useEffect(() => {
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      section.classList.toggle('is-in-view', entry.isIntersecting)
    }, { threshold: 0.12 })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])
  return <section className="section soft-section featured-collection" ref={sectionRef}>
    <div className="container">
      {loading ? <Loading /> : <>
        <div className="featured-collection-heading"><span className="eyebrow">Fresh from the collection</span><h2>Newly Dropped Collections</h2><p>Discover thoughtfully selected favorites, made for style and everyday comfort.</p></div>
        <div className="card-grid featured-product-grid">{products.map(item => <ProductCard key={item._id} item={item} featured />)}</div>
        {products.length === 0 ? <div className="empty-state"><h3>Our collection is coming soon</h3><p>Check back shortly for new arrivals.</p></div> : <div className="featured-collection-more"><Link className="btn btn-ghost" to="/products">See More Collections <ArrowRight size={16} /></Link></div>}
      </>}
    </div>
  </section>
}
function RecommendedCollections() {
  const sectionRef = useRef(null)
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      section.classList.add('is-in-view')
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        section.classList.add('is-in-view')
        observer.disconnect()
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])
  const collections = [
    { name: 'Shoes', image: '/images/category.shoes.png', className: 'recommended-shoes', label: 'View all shoes' },
    { name: 'Dresses', image: '/images/category.dress.png', className: 'recommended-dresses', label: 'View all dresses' },
    { name: 'Dress Lace', image: '/images/category.lace.png', className: 'recommended-lace', label: 'Explore dress lace' },
  ]
  const trending = { name: 'Other', image: '/images/category.others.png' }
  const collectionLink = name => `/products?category=${encodeURIComponent(name)}`
  return <section className="section recommended-collections" ref={sectionRef}>
    <div className="container">
      <div className="recommended-heading"><span className="eyebrow">Explore the collection</span><h2>Most Recommended Collections For You</h2><p>Find something you’ll love, from everyday favorites to standout pieces.</p></div>
      <div className="recommended-grid">
        <Link className={`recommended-card ${collections[0].className}`} to={collectionLink(collections[0].name)} aria-label={collections[0].label}>
          <img src={collections[0].image} alt="" loading="lazy" decoding="async" /><span className="recommended-shade" />
          <span className="recommended-copy"><strong>{collections[0].name}</strong><span className="recommended-button">{collections[0].label}<ArrowRight size={15} /></span></span>
        </Link>
        <div className="recommended-side">{collections.slice(1).map(collection => <Link className={`recommended-card ${collection.className}`} key={collection.name} to={collectionLink(collection.name)} aria-label={collection.label}>
          <img src={collection.image} alt="" loading="lazy" decoding="async" /><span className="recommended-shade" />
          <span className="recommended-copy"><strong>{collection.name}</strong><span className="recommended-button">{collection.label}<ArrowRight size={15} /></span></span>
        </Link>)}</div>
        <Link className="recommended-card recommended-trending" to={collectionLink(trending.name)} aria-label="Explore trending now: Other">
          <img src={trending.image} alt="" loading="lazy" decoding="async" /><span className="recommended-shade" />
          <span className="recommended-copy"><strong>Trending Now</strong><span className="recommended-button">Explore Shop <ArrowUpRight size={15} /></span></span>
          <span className="recommended-trending-tag">{trending.name}</span>
        </Link>
      </div>
    </div>
  </section>
}
function Price({ item }) { return <div className="price-row">{item.discountPrice ? <><strong className="price">{formatMoney(item.discountPrice)}</strong><del>{formatMoney(item.price)}</del></> : <strong className="price">{formatMoney(item.price)}</strong>}</div> }
function formatMoney(value) { return `৳${Number(value || 0).toLocaleString('en-BD')}` }
function getOrderPaidAmount(order) {
  const paidAmount = Number(order.payment?.paidAmount || 0)
  if (paidAmount > 0) return paidAmount
  if (order.payment?.status === 'verified' && !order.payment?.payments?.length) return Number(order.pricing?.total || 0)
  return 0
}
function Loading({ overlay = false }) { return <div className={overlay ? 'loading loading-overlay' : 'loading'} role="status" aria-live="polite"><span className="loading-mark"><span className="loading-ring" /><img src="/s4%20logo.png" alt="" /></span><span className="loading-label">Loading...</span></div> }
function ApiLoadingOverlay() { const isLoading = useSyncExternalStore(subscribeToApiLoading, getApiLoadingSnapshot, getApiLoadingSnapshot); return isLoading ? <Loading overlay /> : null }
function ErrorState({ message }) { return <div className="empty-state"><h3>Something went wrong</h3><p>{message || 'Please try again in a moment.'}</p></div> }
function OrderModal({ item, type, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', district: '', quantity: 1, paymentMethod: '', senderNumber: '', transactionId: '' }); const [summary, setSummary] = useState(null); const [file, setFile] = useState(null); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  const update = e => setForm({ ...form, [e.target.name]: e.target.value }); const change = name => value => setForm({ ...form, [name]: value })
  useEffect(() => { api.post('/orders/calculate', { postType: type, postId: item._id, quantity: form.quantity, district: form.district }).then(r => setSummary(r.data.data)).catch(e => setError(e.message)) }, [type, item._id, form.quantity, form.district])
  const submit = async e => { e.preventDefault(); setError(''); const data = new FormData(); Object.entries({ postType: type, postId: item._id, quantity: form.quantity, paymentMethod: form.paymentMethod, senderNumber: form.senderNumber, transactionId: form.transactionId, customer: JSON.stringify({ name: form.name, phone: form.phone, address: form.address, district: form.district }) }).forEach(([k, v]) => data.append(k, v)); if (file) data.append('paymentScreenshot', file); try { const r = await api.post('/orders', data); setSuccess(`Order submitted. Reference: ${r.data.data.reference}`) } catch (err) { setError(err.message) } }
  if (success) return <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={onClose} aria-label="Close">×</button><h2>Thank you</h2><p>{success}</p><button className="btn btn-primary" onClick={onClose}>Close</button></div></div>
  return <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={onClose} aria-label="Close">×</button><h2>Order {type === 'products' ? item.name : item.title}</h2>{error && <p className="form-error">{error}</p>}<form className="form-grid" onSubmit={submit}><Field label="Your name" name="name" value={form.name} onChange={change('name')} required /><Field label="Phone number" name="phone" value={form.phone} onChange={change('phone')} required /><Field label="District" name="district" value={form.district} onChange={change('district')} /><Field label="Delivery address" name="address" value={form.address} onChange={change('address')} required={type === 'products'} /><Field label="Quantity" name="quantity" type="number" value={form.quantity} onChange={change('quantity')} required /><label>Payment method<select name="paymentMethod" value={form.paymentMethod} onChange={update}><option value="">No advance payment</option>{(summary?.enabledPaymentMethods || []).map(method => <option key={method} value={method}>{method}</option>)}</select></label>{form.paymentMethod && <><Field label="Sender number" name="senderNumber" value={form.senderNumber} onChange={change('senderNumber')} required /><Field label="Transaction ID" name="transactionId" value={form.transactionId} onChange={change('transactionId')} required /><label>Payment screenshot (optional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} /></label></>}{summary && <div className="order-summary"><p>Subtotal: {formatMoney(summary.subtotal)}</p><p>Delivery: {formatMoney(summary.deliveryCharge)}</p><strong>Total: {formatMoney(summary.total)}</strong>{summary.advanceAmount > 0 && <p>Advance: {formatMoney(summary.advanceAmount)} · Remaining: {formatMoney(summary.remainingAmount)}</p>}</div>}<button className="btn btn-primary" type="submit">Submit order</button></form></div></div>
}
function Home() {
  const [products, setProducts] = useState([]); const [packages, setPackages] = useState([]); const [loading, setLoading] = useState(true)
  const [activeBanner, setActiveBanner] = useState(0)
  const [bannerPaused, setBannerPaused] = useState(false)
  const journeySectionRef = useRef(null)
  const featuredPackagesRef = useRef(null)
  const banners = [
    { image: '/images/Banner1.png', eyebrow: 'Step into your style', title: <>Sneakers That<br />Defy Your Everyday Look</>, action: 'Shop shoes', category: 'Shoes', position: 'center' },
    { image: '/images/Banner2.png', eyebrow: 'Made to feel like you', title: <>Effortless Style<br />For Every Occasion</>, action: 'Explore dresses', category: 'Dresses', position: 'center' },
    { image: '/images/Banner3.png', eyebrow: 'Everyday, in motion', title: <>Move Freely.<br />Look Unforgettable.</>, action: 'Find your pair', category: 'Shoes', position: 'center' },
  ]
  useEffect(() => { Promise.all([api.get('/products?limit=6'), api.get('/packages?limit=3')]).then(([p, t]) => { setProducts(p.data.data); setPackages(t.data.data) }).finally(() => setLoading(false)) }, [])
  useEffect(() => {
    const sections = [journeySectionRef.current, featuredPackagesRef.current].filter(Boolean)
    if (!sections.length) return
    const targets = sections.flatMap(section => [...section.querySelectorAll('.section-heading, .provider-card, .featured-package-grid > .package-card')])
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach(element => element.classList.add('is-revealed'))
      return
    }
    let frame = 0
    const revealVisible = () => {
      frame = 0
      targets.forEach(element => {
        const rect = element.getBoundingClientRect()
        if (rect.bottom > 0 && rect.top < window.innerHeight) element.classList.add('is-revealed')
      })
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(revealVisible)
    }
    revealVisible()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [loading])
  useEffect(() => {
    if (bannerPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setActiveBanner(index => (index + 1) % banners.length), 6000)
    return () => clearInterval(timer)
  }, [bannerPaused, banners.length])
  const changeBanner = direction => setActiveBanner(index => (index + direction + banners.length) % banners.length)
  const currentBanner = banners[activeBanner]
  return <Layout><main className="landing-page"><section className="hero-section" aria-label="Featured collections">
    {banners.map((banner, index) => <div className={`hero-slide${index === activeBanner ? ' is-active' : ''}`} key={banner.image} aria-hidden={index !== activeBanner}>
      <img className="hero-slide-image" src={banner.image} alt="" style={{ objectPosition: banner.position }} />
      <div className="hero-slide-shade" />
    </div>)}
    <div className="container hero-content" key={activeBanner}>
      <span className="eyebrow">{currentBanner.eyebrow}</span>
      <h1>{currentBanner.title}</h1>
      <p>Discover thoughtful fashion and everyday essentials, chosen to make every day feel a little more like you.</p>
      <div className="hero-actions"><Link className="btn btn-primary" to={`/products?category=${encodeURIComponent(currentBanner.category)}`}>{currentBanner.action} <ArrowRight size={17} /></Link></div>
    </div>
    <div className="hero-controls" aria-label="Banner controls">
      <button type="button" className="hero-control hero-pause" aria-label={bannerPaused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setBannerPaused(paused => !paused)}>{bannerPaused ? <Play size={16} /> : <Pause size={16} />}</button>
      <button type="button" className="hero-control" aria-label="Previous banner" onClick={() => changeBanner(-1)}><ChevronLeft size={19} /></button>
      <button type="button" className="hero-control" aria-label="Next banner" onClick={() => changeBanner(1)}><ChevronRight size={19} /></button>
    </div>
    <div className="hero-pagination" aria-label={`Banner ${activeBanner + 1} of ${banners.length}`}>{banners.map((banner, index) => <button key={banner.image} type="button" className={index === activeBanner ? 'active' : ''} aria-label={`Show banner ${index + 1}`} aria-pressed={index === activeBanner} onClick={() => setActiveBanner(index)} />)}</div>
  </section><CategorySection /><FeaturedCollection loading={loading} products={products} /><RecommendedCollections /><section className="section journey-section" ref={journeySectionRef}><div className="container"><SectionHeading eyebrow="Go further" title="Journeys worth taking" link="Explore packages" to="/packages" /><div className="provider-grid"><div className="provider-card" data-reveal-direction="left"><span className="eyebrow">S Alam Tours & Travels</span><h3>See more of the world, your way.</h3><p>Comfortable, considered itineraries for meaningful escapes at home and abroad.</p><Link to={`/packages?provider=${encodeURIComponent('S Alam Tours & Travels')}`} className="text-link">Explore tours <ArrowRight size={16} /></Link></div><div className="provider-card provider-dark" data-reveal-direction="right"><span className="eyebrow">S Alam Hajj Kafela</span><h3>A sacred journey, thoughtfully supported.</h3><p>Reliable Hajj and Umrah packages with care at every step.</p>  <Link to={`/packages?provider=${encodeURIComponent('S Alam Hajj Kafela')}`} className="text-link">Explore Hajj & Umrah <ArrowRight size={16} /></Link></div></div></div></section><section className="section soft-section featured-packages-section" ref={featuredPackagesRef}><div className="container">{loading ? <Loading /> : <><SectionHeading eyebrow="Plan your next chapter" title="Featured packages" link="See all packages" to="/packages" /><div className="card-grid package-grid featured-package-grid">{packages.map(item => <PackageCard key={item._id} item={item} />)}</div></>}</div></section><AboutSection /><HomeContactSection /></main></Layout>
}
function CategorySection() {
  const sectionRef = useRef(null)
  useEffect(() => {
    const section = sectionRef.current
    const stage = section?.querySelector('.category-stage')
    const cards = section ? [...section.querySelectorAll('.category-stack-card')] : []
    if (!section || !stage || !cards.length) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      section.classList.add('motion-disabled')
      return
    }

    let frame = 0
    let sectionStart = 0
    let travelDistance = 0
    let stickyTop = 0

    const updateLayout = () => {
      stickyTop = document.querySelector('.site-header')?.getBoundingClientRect().height || 76
      stage.style.top = `${stickyTop}px`
      stage.style.height = `${Math.max(320, window.innerHeight - stickyTop)}px`
      const stageHeight = stage.getBoundingClientRect().height
      const stepDistance = Math.max(420, stageHeight * 0.66)
      section.style.height = `${stageHeight + stepDistance * (cards.length - 1)}px`
      sectionStart = section.getBoundingClientRect().top + window.scrollY - stickyTop
      travelDistance = Math.max(1, section.offsetHeight - stageHeight)
      section.classList.add('is-ready')
      updateOnScroll()
    }

    const updateOnScroll = () => {
      frame = 0
      const progress = Math.max(0, Math.min(1, (window.scrollY - sectionStart) / travelDistance)) * (cards.length - 1)
      const cardWidth = cards[0].getBoundingClientRect().width
      const stackStep = Math.min(cardWidth * 0.22, window.innerWidth * 0.1)
      const enterDistance = window.innerWidth * 0.72 + cardWidth * 0.5
      const sectionRect = section.getBoundingClientRect()
      const isInView = sectionRect.top < window.innerHeight * 0.82 && sectionRect.bottom > stickyTop + 40
      section.classList.toggle('is-in-view', isInView)
      cards.forEach((card, index) => {
        const distance = index - progress
        const offset = distance < 0 ? distance * stackStep : distance * enterDistance
        const scale = Math.max(0.78, 1 - Math.abs(distance) * 0.035)
        const rotation = Math.max(-4, Math.min(4, distance < 0 ? distance * 1.1 : 0))
        card.style.setProperty('--stack-x', `${offset}px`)
        card.style.setProperty('--stack-scale', String(scale))
        card.style.setProperty('--stack-rotation', `${rotation}deg`)
        card.style.zIndex = String(100 - Math.round(Math.abs(distance) * 10))
      })
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateOnScroll)
    }
    updateLayout()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateLayout)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateLayout)
    }
  }, [])

  return <section className="section category-section category-scroll-section" ref={sectionRef}>
    <div className="category-stage">
      <div className="container category-stage-inner">
        <div className="section-heading category-heading">
          <div><span className="eyebrow">The collection</span><h2>Made for your everyday</h2></div>
          <Link className="text-link" to="/products">Browse all <ArrowRight size={16} /></Link>
        </div>
        <div className="category-stack">
          {landingCategories.map(category => <Link className="category category-stack-card" key={category.name} to={`/products?category=${encodeURIComponent(category.name)}`} aria-label={`Explore ${category.name}`}><img className="category-image" src={category.image} alt="" loading="eager" decoding="async" /><span className="category-shade" /><span className="category-default"><strong>{category.name}</strong><span>{category.copy}</span><span className="category-action">{category.action} <ArrowRight size={16} /></span></span><span className="category-hover" aria-hidden="true"><strong>{category.name}</strong><span className="category-hover-action">Shop {category.name} <ArrowRight size={16} /></span></span></Link>)}
        </div>
      </div>
    </div>
  </section>
}

function AboutSection() {
  const sectionRef = useRef(null)
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      section.classList.toggle('is-animated', entry.isIntersecting)
    }, { threshold: 0.01 })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])
  return <section className="section home-about-section" id="home-about" ref={sectionRef}>
    <div className="container">
      <div className="home-section-heading"><span className="eyebrow">A little about S4</span><h2>Style for the everyday.<br />Journeys to remember.</h2><p>We bring together thoughtful finds for your wardrobe and travel experiences worth looking forward to.</p></div>
      <div className="home-about-layout">
        <div className="home-about-story"><span className="home-about-monogram">S4</span><span className="eyebrow">Style & Journeys</span><h3>Find your next favorite, or your next destination.</h3><p>From everyday fashion and essentials to carefully presented travel and pilgrimage packages, S4 helps make discovering what you need feel simple and inspiring.</p><Link className="home-about-link" to="/products">Discover S4 <ArrowRight size={16} /></Link></div>
        <div className="home-about-values"><article><span>01</span><div><h3>Everyday style</h3><p>Explore pieces selected to fit your personal style and daily life.</p></div></article><article><span>02</span><div><h3>Meaningful journeys</h3><p>Browse travel options and pilgrimage packages for your next chapter.</p></div></article><article><span>03</span><div><h3>One place to explore</h3><p>Move easily from finding a favorite product to planning a journey.</p></div></article></div>
      </div>
    </div>
  </section>
}
function HomeContactSection() {
  const sectionRef = useRef(null)
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const targets = [...section.querySelectorAll('.home-section-heading, .home-contact-button')]
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach(target => target.classList.add('is-revealed'))
      return
    }
    let frame = 0
    const revealVisible = () => {
      frame = 0
      targets.forEach(target => {
        const rect = target.getBoundingClientRect()
        if (rect.bottom > 0 && rect.top < window.innerHeight) target.classList.add('is-revealed')
      })
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(revealVisible)
    }
    revealVisible()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return <section className="home-contact-section" ref={sectionRef}>
    <div className="container home-contact-inner">
      <span className="home-contact-mark" aria-hidden="true">S4</span>
      <div className="home-section-heading"><span className="eyebrow">We’re here to help</span><h2>Let’s make it personal.</h2><p>Questions about a product, a package, or placing an order? We’d love to hear from you.</p></div>
      <Link className="home-contact-button" to="/contact">Get in touch <ArrowRight size={17} /></Link>
    </div>
  </section>
}
function ProductResults({ items }) {
  const gridRef = useRef(null)
  useEffect(() => {
    const cards = [...(gridRef.current?.querySelectorAll('.product-card') || [])]
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach(card => card.classList.add('is-visible'))
      return
    }
    if (!('IntersectionObserver' in window)) {
      cards.forEach(card => card.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }), { threshold: 0.05, rootMargin: '0px' })
    cards.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [items])
  return <div className="card-grid products-results" ref={gridRef}>{items.map(item => <ProductCard key={item._id} item={item} />)}</div>
}
function Products() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const category = params.get('category') || ''
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => setSearchInput(search), [search])
  useEffect(() => {
    if (searchInput.trim() === search) return
    const timeout = setTimeout(() => {
      setParams(previous => {
        const next = new URLSearchParams(previous)
        const value = searchInput.trim()
        if (value) next.set('search', value)
        else next.delete('search')
        return next
      }, { replace: true })
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchInput, search, setParams])
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.get(`/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&limit=50`)
      .then(response => { if (active) setItems(response.data.data) })
      .catch(requestError => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, category])

  const selectCategory = value => setParams(previous => {
    const next = new URLSearchParams(previous)
    if (value) next.set('category', value)
    else next.delete('category')
    return next
  })

  return <Layout><main className="container page products-page">
    <div className="page-intro products-intro"><span className="eyebrow">The collection</span><h1>Everyday, elevated.</h1><p>Thoughtful pieces chosen for how you actually live.</p></div>
    <div className="products-layout">
      <aside className="products-sidebar" aria-label="Browse product categories">
        <div className="products-sidebar-heading"><span>Browse categories</span>{category && <button type="button" onClick={() => selectCategory('')}>Clear</button>}</div>
        <div className="products-category-list">
          <button type="button" className={!category ? 'active' : ''} aria-pressed={!category} onClick={() => selectCategory('')}><span className="products-category-indicator" aria-hidden="true" />All products</button>
          {categories.map(value => <button type="button" key={value} className={category === value ? 'active' : ''} aria-pressed={category === value} onClick={() => selectCategory(value)}><span className="products-category-indicator" aria-hidden="true" />{value}</button>)}
        </div>
      </aside>
      <section className="products-main" aria-label="Products">
        <div className="toolbar products-toolbar">
          <label className="search-box"><Search size={18} aria-hidden="true" /><input type="search" value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Search by name, category, or detail" aria-label="Search products by name, category, or detail" />{searchInput && <button className="products-clear" type="button" onClick={() => setSearchInput('')} aria-label="Clear search">Clear</button>}</label>
        </div>
        {!loading && !error && <p className="products-result-count" aria-live="polite">{items.length} {items.length === 1 ? 'piece' : 'pieces'}{search ? ` matching “${search}”` : ''}{category ? ` in ${category}` : ''}</p>}
        {loading ? <Loading /> : error ? <ErrorState message={error} /> : items.length ? <ProductResults items={items} /> : <div className="empty-state products-empty"><h3>No products found</h3><p>Try another search or category to explore the collection.</p></div>}
      </section>
    </div>
  </main></Layout>
}
function Packages() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [params, setParams] = useSearchParams(); const requestedProvider = params.get('provider') || ''; const provider = providers.find(p => p === requestedProvider) || providers.find(p => requestedProvider.trim() && p.startsWith(requestedProvider.trim())) || requestedProvider
  useEffect(() => { setLoading(true); setError(''); api.get(`/packages?provider=${encodeURIComponent(provider)}&limit=50`).then(r => setItems(r.data.data)).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [provider])
  return <Layout><main className="container page packages-page"><div className="page-intro"><span className="eyebrow">Journeys</span><h1>Go somewhere meaningful.</h1><p>Curated travel, Hajj, and Umrah packages from people who care about the details.</p></div><div className="filter-pills"><button className={!provider ? 'active' : ''} onClick={() => setParams({})}>All packages</button>{providers.map(p => <button className={provider === p ? 'active' : ''} key={p} onClick={() => setParams({ provider: p })}>{p}</button>)}</div>{loading ? <Loading /> : error ? <ErrorState message={error} /> : items.length ? <div className="card-grid package-grid">{items.map(item => <PackageCard key={item._id} item={item} />)}</div> : <div className="empty-state"><h3>New journeys are being prepared</h3><p>Please check back soon.</p></div>}</main></Layout>
}
function ProductDetail({ item, slug, link }) {
  const [activeImage, setActiveImage] = useState(0)
  const [orderOpen, setOrderOpen] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const { addToCart } = useCart()
  const images = item.images || []
  const image = images[activeImage]?.url || images[0]?.url

  useEffect(() => {
    if (!cartMessage) return
    const timeout = setTimeout(() => setCartMessage(''), 1800)
    return () => clearTimeout(timeout)
  }, [cartMessage])

  const add = () => {
    const result = addToCart(item)
    setCartMessage(result === 'added' ? 'Added to cart' : result === 'max' ? 'Stock limit reached' : 'Out of stock')
  }

  return <Layout>
    <main className="container product-detail-page" key={slug}>
      <div className="product-detail-layout">
        <section className={`product-gallery${images.length > 1 ? ' has-thumbnails' : ''}`} aria-label={`${item.name} images`}>
          {images.length > 1 && <div className="product-thumbnails" aria-label="Choose product image">
            {images.map((imageItem, index) => <button className={activeImage === index ? 'active' : ''} type="button" key={imageItem.publicId || imageItem.url} onClick={() => setActiveImage(index)} aria-label={`View image ${index + 1}`} aria-pressed={activeImage === index}>
              <Image src={imageItem.url} alt={`${item.name} ${index + 1}`} />
            </button>)}
          </div>}
          <div className="product-main-image"><Image src={image} alt={item.name} /></div>
        </section>
        <section className="product-detail-copy" aria-label="Product details">
          <nav className="product-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/products">Products</Link><span aria-hidden="true">/</span>
            <Link to={`/products?category=${encodeURIComponent(item.category)}`}>{item.category}</Link>
          </nav>
          <span className="product-detail-category">{item.category}</span>
          <h1>{item.name}</h1>
          <Price item={item} />
          <p className={`product-detail-stock${item.stock < 1 ? ' unavailable' : ''}`} role="status">{item.stock > 0 ? `${item.stock} available` : 'Currently unavailable'}</p>
          {item.description && <div className="product-detail-description"><h2>Description</h2><p>{item.description}</p></div>}
          <div className="product-detail-actions">
            <button className="btn btn-ghost" type="button" onClick={add} disabled={item.stock < 1} aria-live="polite"><ShoppingCart size={17} />{cartMessage || 'Add to cart'}</button>
            <button className="btn btn-primary" type="button" onClick={() => setOrderOpen(true)} disabled={item.stock < 1}>Order now <ArrowRight size={17} /></button>
          </div>
          {link ? <a className="product-whatsapp-link" href={link} target="_blank" rel="noreferrer">More information on WhatsApp <ArrowRight size={15} /></a> : <p className="product-whatsapp-unavailable">WhatsApp contact is currently unavailable.</p>}
        </section>
      </div>
    </main>
    {orderOpen && <OrderModal item={item} type="products" onClose={() => setOrderOpen(false)} />}
  </Layout>
}
function PackageDetail({ item, slug, link }) {
  const [activeImage, setActiveImage] = useState(0)
  const [orderOpen, setOrderOpen] = useState(false)
  const images = item.images || []
  const image = images[activeImage]?.url || images[0]?.url
  const departureDate = item.departureDate
    ? new Date(item.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : 'Contact us for upcoming dates'
  const lists = [
    { key: 'highlights', initial: 'H', title: 'Highlights', items: item.highlights },
    { key: 'inclusions', initial: 'I', title: 'Inclusions', items: item.inclusions },
    { key: 'exclusions', initial: 'E', title: 'Exclusions', items: item.exclusions },
  ]

  return <Layout>
    <main className="container package-detail-page" key={slug}>
      <Link className="package-detail-back" to="/packages"><ChevronLeft size={16} /> All packages</Link>
      <section className="package-detail-hero" aria-label={`${item.title} images`}>
        <div className="package-detail-main-image">
          <Image src={image} alt={item.title} loading="eager" />
          <span className="package-detail-provider">{item.provider === providers[1] ? 'Hajj & Umrah' : 'Tours & Travels'}</span>
          {images.length > 1 && <>
            <button className="package-gallery-control previous" type="button" onClick={() => setActiveImage(index => (index - 1 + images.length) % images.length)} aria-label="Previous package image"><ChevronLeft size={20} /></button>
            <button className="package-gallery-control next" type="button" onClick={() => setActiveImage(index => (index + 1) % images.length)} aria-label="Next package image"><ChevronRight size={20} /></button>
          </>}
        </div>
        {images.length > 1 && <div className="package-detail-thumbnails" aria-label="Choose package image">
          {images.map((imageItem, index) => <button className={activeImage === index ? 'active' : ''} type="button" key={imageItem.publicId || imageItem.url} onClick={() => setActiveImage(index)} aria-label={`View package image ${index + 1}`} aria-pressed={activeImage === index}>
            <Image src={imageItem.url} alt={`${item.title} ${index + 1}`} />
          </button>)}
        </div>}
      </section>
      <section className="package-detail-summary" aria-label="Package overview">
        <span className="eyebrow">{item.packageType || item.provider}</span>
        <h1>{item.title}</h1>
        <strong className="package-detail-price">From {formatMoney(item.price)}</strong>
        {item.duration && <span className="package-detail-duration"><Clock3 size={16} />{item.duration}</span>}
      </section>
      {item.description && <section className="package-detail-description">
        <span className="eyebrow">The journey</span>
        <h2>About this package</h2>
        <p>{item.description}</p>
      </section>}
      <section className="package-detail-lists" aria-label="Package details">
        {lists.map(({ key, initial, title, items: list }) => <article className={`package-info-card package-info-${key}`} key={key}>
          <span className="package-info-initial" aria-hidden="true">{initial}</span>
          <span className="eyebrow">{title}</span>
          <h2>{title}</h2>
          {list?.length
            ? <ul>{list.map((entry, index) => <li key={`${entry}-${index}`}><Check size={16} />{entry}</li>)}</ul>
            : <p className="package-info-empty">Details available on request.</p>}
        </article>)}
      </section>
      <section className="package-detail-departure">
        <div className="package-departure-icon"><MapPin size={20} /></div>
        <div><span className="eyebrow">Departure</span><strong><CalendarDays size={16} />{departureDate}</strong></div>
      </section>
      <section className="package-detail-actions" aria-label="Package enquiry">
        <button className="btn btn-primary" type="button" onClick={() => setOrderOpen(true)}>Order Now <ArrowRight size={17} /></button>
        {link
          ? <a className="btn btn-whatsapp" href={link} target="_blank" rel="noreferrer">More information <MessageCircle size={17} /></a>
          : <Link className="btn btn-whatsapp" to="/contact">More information <MessageCircle size={17} /></Link>}
      </section>
    </main>
    {orderOpen && <OrderModal item={item} type="packages" onClose={() => setOrderOpen(false)} />}
  </Layout>
}
function Detail({ type }) {
  const { slug } = useParams(); const [item, setItem] = useState(null); const [error, setError] = useState('')
  useEffect(() => { api.get(`/${type}/${slug}`).then(r => setItem(r.data.data)).catch(e => setError(e.message)) }, [type, slug])
  if (error) return <Layout><main className="container page"><ErrorState message={error} /></main></Layout>; if (!item) return <Layout><main className="container page"><Loading /></main></Layout>
  const isProduct = type === 'products'; const title = isProduct ? item.name : item.title; const message = `Hello, I would like more information about ${title}.`
  const link = whatsappLink(`${message} Link: ${window.location.href}`, item.contact?.whatsapp || undefined)
  if (isProduct) return <ProductDetail key={slug} item={item} slug={slug} link={link} />
  return <PackageDetail key={slug} item={item} slug={slug} link={link} />
}
function CartPage() {
  const { items, cartCount, setQuantity, removeFromCart } = useCart()
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', district: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [references, setReferences] = useState([])
  const [success, setSuccess] = useState(false)
  const subtotal = items.reduce((total, item) => total + Number(item.discountPrice || item.price) * item.quantity, 0)
  const checkout = async event => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const createdReferences = []
    for (const item of items) {
      try {
        const response = await api.post('/orders', {
          postType: 'products',
          postId: item._id,
          quantity: item.quantity,
          customer,
        })
        createdReferences.push(response.data.data.reference)
        removeFromCart(item._id)
      } catch (requestError) {
        setReferences(createdReferences)
        setError(`${requestError.message}${createdReferences.length ? ` Orders already placed: ${createdReferences.join(', ')}.` : ''}`)
        setSubmitting(false)
        return
      }
    }
    setReferences(createdReferences)
    setSuccess(true)
    setSubmitting(false)
  }
  return <Layout><main className="container page cart-page">
    <div className="page-intro"><span className="eyebrow">Your selection</span><h1>Your cart.</h1><p>{cartCount ? `${cartCount} item${cartCount === 1 ? '' : 's'} ready for checkout.` : 'Your cart is waiting for something you love.'}</p></div>
    {!items.length ? <section className="cart-empty"><ShoppingCart size={34} /><h2>Your cart is empty</h2><p>Browse the collection and add your favorite products.</p><Link className="btn btn-primary" to="/products">Explore products <ArrowRight size={16} /></Link></section> : <div className="cart-layout">
      <section className="cart-items" aria-label="Items in your cart">{items.map(item => <article className="cart-item" key={item._id}>
        <Link className="cart-item-image" to={`/products/${item.slug}`}><Image src={item.images?.[0]?.url} alt={item.name} /></Link>
        <div className="cart-item-info"><span className="card-kicker">{item.category}</span><Link to={`/products/${item.slug}`}><h2>{item.name}</h2></Link><strong>{formatMoney(item.discountPrice || item.price)}</strong><span className="cart-item-stock">{item.stock} in stock</span></div>
        <div className="cart-item-controls"><label>Qty<input aria-label={`Quantity for ${item.name}`} type="number" min="1" max={item.stock} value={item.quantity} onChange={event => setQuantity(item._id, event.target.value)} /></label><strong>{formatMoney(Number(item.discountPrice || item.price) * item.quantity)}</strong><button className="cart-remove" type="button" onClick={() => removeFromCart(item._id)} aria-label={`Remove ${item.name}`}><Trash2 size={17} /> Remove</button></div>
      </article>)}</section>
      <aside className="cart-checkout"><span className="eyebrow">Order summary</span><div className="cart-summary-line"><span>Items</span><span>{cartCount}</span></div><div className="cart-summary-line"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><p className="cart-delivery-note">Delivery charge will be confirmed by our team.</p><form className="cart-checkout-form" onSubmit={checkout}><h2>Delivery details</h2><Field label="Your name" name="name" value={customer.name} onChange={value => setCustomer(previous => ({ ...previous, name: value }))} required /><Field label="Phone number" name="phone" type="tel" value={customer.phone} onChange={value => setCustomer(previous => ({ ...previous, phone: value }))} required /><Field label="District" name="district" value={customer.district} onChange={value => setCustomer(previous => ({ ...previous, district: value }))} required /><Field label="Delivery address" name="address" value={customer.address} onChange={value => setCustomer(previous => ({ ...previous, address: value }))} required />{error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary cart-checkout-button" type="submit" disabled={submitting}>{submitting ? 'Placing orders...' : 'Place order'} <ArrowRight size={16} /></button></form>
      </aside>
    </div>}
    {success && <div className="modal-backdrop contact-success-backdrop"><section className="contact-success-modal" role="dialog" aria-modal="true" aria-labelledby="cart-success-title"><span className="contact-success-icon"><Check size={24} /></span><span className="eyebrow">Order received</span><h2 id="cart-success-title">Thank you for your order.</h2><p>{references.length === 1 ? 'Your order' : `Your ${references.length} orders`} {references.length === 1 ? 'has' : 'have'} been placed. Reference{references.length === 1 ? '' : 's'}: {references.join(', ')}</p><button className="btn btn-primary" type="button" onClick={() => setSuccess(false)}>Continue shopping</button></section></div>}
  </main></Layout>
}
function AdminLogin() { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate(); const submit = async e => { e.preventDefault(); setError(''); try { await api.post('/auth/login', { email, password }); navigate('/admin/dashboard') } catch (err) { setError(err.message) } }; return <div className="admin-login"><div className="login-card"><Logo /><span className="eyebrow">Private workspace</span><h1>Welcome back.</h1><p className="muted">Sign in to manage S4.</p><form onSubmit={submit} className="form-stack"><Field label="Email" type="email" value={email} onChange={setEmail} required /><Field label="Password" type="password" value={password} onChange={setPassword} required />{error && <p className="form-error">{error}</p>}<button className="btn btn-primary" type="submit">Sign in <ArrowRight size={17} /></button></form><Link className="back-link" to="/">← Back to website</Link></div></div> }
function AdminLayout({ children }) { const navigate = useNavigate(); const [authorized, setAuthorized] = useState(null); useEffect(() => { api.get('/auth/me').then(r => setAuthorized(r.data.data?.role === 'admin')).catch(() => { setAuthorized(false); navigate('/admin/login') }) }, [navigate]); if (authorized === null) return <Loading />; return <div className="admin-shell"><aside className="admin-sidebar"><Logo /><nav><NavLink to="/admin/dashboard">Overview</NavLink><NavLink to="/admin/orders">Orders</NavLink><NavLink to="/admin/contact-messages">Messages</NavLink><NavLink to="/admin/settings">Settings</NavLink><NavLink to="/admin/products">Products</NavLink><NavLink to="/admin/packages">Packages</NavLink><NavLink to="/admin/employees">Employees</NavLink><NavLink to="/admin/requests">Requests</NavLink></nav><button className="logout-btn" onClick={async () => { await api.post('/auth/logout'); navigate('/admin/login') }}><LogOut size={16} /> Sign out</button></aside><main className="admin-main">{children}</main></div> }
function Dashboard() { const [data, setData] = useState(null); useEffect(() => { api.get('/admin/dashboard').then(r => setData(r.data.data)) }, []); if (!data) return <Loading />; return <AdminLayout><AdminHeader title="Good morning." /><div className="stats-grid"><Stat label="Sales & orders with payments" value={data.paidOrders} /><Stat label="Packages" value={data.totalPackages} /><Stat label="Products" value={data.totalProducts} /><Stat label="Revenue received" value={formatMoney(data.revenue)} /></div><div className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">Latest activity</span><h2>Recent sales</h2></div><span className="muted">Genuine records only</span></div>{data.recentSales?.length ? data.recentSales.map(s => <div className="sale-row" key={s._id}><div><strong>{s.customerName}</strong><span>{s.status}</span></div><strong>{formatMoney(s.amount)}</strong></div>) : <div className="empty-state small"><p>No sales have been recorded yet.</p></div>}</div></AdminLayout> }
function Stat({ label, value }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div> }
function AdminHeader({ title, action }) { return <div className="admin-header"><div><span className="eyebrow">S4 admin</span><h1>{title}</h1></div>{action}</div> }
function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Cash', transactionId: '', note: '' })
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/orders', { params: { ...(statusFilter && { status: statusFilter }), ...(paymentFilter && { paymentStatus: paymentFilter }) } })
      setOrders(response.data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [paymentFilter, statusFilter])
  useEffect(() => { load() }, [load])
  const update = async (id, data) => {
    try {
      await api.patch(`/orders/${id}`, data)
      await load()
      if (selected?._id === id) {
        const response = await api.get(`/orders/${id}`)
        setSelected(response.data.data)
      }
    } catch (err) {
      setError(err.message)
    }
  }
  const openDetails = async id => {
    setPaymentError('')
    setPaymentSuccess('')
    try {
      const response = await api.get(`/orders/${id}`)
      const order = response.data.data
      const paid = getOrderPaidAmount(order)
      setSelected(order)
      setPaymentForm({ amount: String(Math.max(0, Number(order.pricing?.total || 0) - paid)), method: 'Cash', transactionId: '', note: '' })
    } catch (err) {
      setError(err.message)
    }
  }
  const recordPayment = async event => {
    event.preventDefault()
    if (!selected) return
    setPaymentSaving(true)
    setPaymentError('')
    setPaymentSuccess('')
    try {
      await api.post(`/orders/${selected._id}/payments`, paymentForm)
      const response = await api.get(`/orders/${selected._id}`)
      setSelected(response.data.data)
      setPaymentForm({ amount: String(Math.max(0, Number(response.data.data.pricing?.total || 0) - getOrderPaidAmount(response.data.data))), method: 'Cash', transactionId: '', note: '' })
      setPaymentSuccess('Payment recorded successfully.')
      await load()
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaymentSaving(false)
    }
  }
  const visibleOrders = orders.filter(order => {
    const query = search.trim().toLowerCase()
    return !query || [order.reference, order.customer?.name, order.customer?.phone].some(value => String(value || '').toLowerCase().includes(query))
  })
  return <AdminLayout><AdminHeader title="Orders" /><div className="admin-panel">
    <div className="toolbar orders-toolbar"><label className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, customer, or phone" /></label><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All order statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option></select><select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}><option value="">All payment statuses</option><option value="unpaid">Unpaid</option><option value="submitted">Submitted</option><option value="partial">Partially paid</option><option value="paid">Paid</option><option value="verified">Verified (legacy)</option><option value="rejected">Rejected</option><option value="refunded">Refunded</option></select></div>
    {error && <div className="empty-state"><h3>Unable to load orders</h3><p>{error}</p><button className="btn btn-primary" onClick={load}>Try again</button></div>}
    {loading ? <Loading /> : !error && !visibleOrders.length ? <div className="empty-state"><p>{orders.length ? 'No orders match the selected filters.' : 'No orders have been submitted.'}</p></div> : !error && <div className="orders-list">{visibleOrders.map(order => <article className="order-row" key={order._id}>
      <div className="order-row-customer"><strong>{order.reference}</strong><span>{order.customer?.name} · {order.postType}</span><small>{order.customer?.phone}</small></div>
      <div className="order-row-amount"><strong>{formatMoney(order.pricing?.total)}</strong><span>{formatMoney(getOrderPaidAmount(order))} received</span></div>
      <span className={`order-payment-badge ${order.payment?.status || 'unpaid'}`}>{(order.payment?.status || 'unpaid').replace('_', ' ')}</span>
      <button className="btn btn-ghost order-details-button" type="button" onClick={() => openDetails(order._id)}>Details / payment</button>
      <label className="order-status-control"><span>Order status</span><select value={order.status} onChange={e => update(order._id, { status: e.target.value })}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option></select></label>
      {order.payment?.status === 'submitted' && <button className="btn btn-ghost order-reject-button" type="button" onClick={() => update(order._id, { paymentStatus: 'rejected', rejectionReason: 'Payment evidence rejected' })}>Reject proof</button>}
    </article>)}</div>}
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="modal order-details-modal" role="dialog" aria-modal="true" aria-labelledby="order-details-title" onClick={event => event.stopPropagation()}>
      <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button>
      <span className="eyebrow">Order details</span><h2 id="order-details-title">{selected.reference}</h2>
      <div className="order-details-summary"><p><strong>{selected.customer?.name}</strong> · {selected.customer?.phone}</p><p>{selected.customer?.address || 'No address provided'}{selected.customer?.district ? `, ${selected.customer.district}` : ''}</p><p>Subtotal: {formatMoney(selected.pricing?.subtotal)} · Delivery: {formatMoney(selected.pricing?.deliveryCharge)} · Total: <strong>{formatMoney(selected.pricing?.total)}</strong></p><p>Payment status: <strong>{selected.payment?.status || 'unpaid'}</strong> · Received: <strong>{formatMoney(getOrderPaidAmount(selected))}</strong> · Balance: <strong>{formatMoney(Math.max(0, Number(selected.pricing?.total || 0) - getOrderPaidAmount(selected)))}</strong></p>{selected.payment?.transactionId && <p>Submitted transaction: {selected.payment.transactionId}</p>}{selected.payment?.screenshot?.url && <a className="text-link" href={selected.payment.screenshot.url} target="_blank" rel="noreferrer">View payment proof <ArrowUpRight size={15} /></a>}</div>
      <div className="order-payment-history"><h3>Payment history</h3>{selected.payment?.payments?.length ? selected.payment.payments.map(payment => <div className="order-payment-entry" key={payment._id}><div><strong>{formatMoney(payment.amount)} · {payment.method}</strong><span>{payment.transactionId || payment.note || 'Manual payment recorded'}</span></div><time>{new Date(payment.receivedAt).toLocaleString()}</time></div>) : <p>{selected.payment?.status === 'verified' ? `Legacy verified payment: ${formatMoney(getOrderPaidAmount(selected))}` : 'No payments have been recorded yet.'}</p>}</div>
      {Number(selected.pricing?.total || 0) > getOrderPaidAmount(selected) && selected.payment?.status !== 'refunded' && <form className="order-payment-form" onSubmit={recordPayment}><h3>Record received payment</h3><p>Record cash, mobile banking, or bank payments. The paid status updates automatically when the total is received.</p>
        <div className="order-payment-form-grid"><label className="field"><span>Amount received</span><input type="number" min="0.01" max={Math.max(0, Number(selected.pricing?.total || 0) - getOrderPaidAmount(selected))} step="0.01" value={paymentForm.amount} onChange={event => setPaymentForm(previous => ({ ...previous, amount: event.target.value }))} required /></label><label className="field"><span>Payment method</span><select value={paymentForm.method} onChange={event => setPaymentForm(previous => ({ ...previous, method: event.target.value }))}><option>Cash</option><option>bKash</option><option>Nagad</option><option>Rocket</option><option>Bank transfer</option><option>Other</option></select></label><label className="field"><span>Transaction/reference ID <small>Optional</small></span><input value={paymentForm.transactionId} onChange={event => setPaymentForm(previous => ({ ...previous, transactionId: event.target.value }))} maxLength="120" /></label><label className="field"><span>Note <small>Optional</small></span><input value={paymentForm.note} onChange={event => setPaymentForm(previous => ({ ...previous, note: event.target.value }))} maxLength="500" /></label></div>
        {paymentError && <p className="form-error" role="alert">{paymentError}</p>}{paymentSuccess && <p className="payment-success" role="status">{paymentSuccess}</p>}
        <button className="btn btn-primary" type="submit" disabled={paymentSaving}>{paymentSaving ? 'Saving payment...' : 'Add payment'}</button>
      </form>}
    </section></div>}
  </div></AdminLayout>
}
function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/contact-messages')
      setMessages(response.data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])
  const markRead = async id => {
    try {
      await api.patch(`/contact-messages/${id}/read`)
      setMessages(current => current.map(message => message._id === id ? { ...message, status: 'read' } : message))
    } catch (err) {
      setError(err.message)
    }
  }
  const newCount = messages.filter(message => message.status === 'new').length
  return <AdminLayout><AdminHeader title="Contact messages" action={<span className="contact-message-count">{newCount} new</span>} /><div className="admin-panel contact-messages-panel">
    {error && <div className="empty-state"><h3>Unable to load messages</h3><p>{error}</p><button className="btn btn-primary" onClick={load}>Try again</button></div>}
    {loading ? <Loading /> : !error && messages.length ? <div className="contact-message-list">{messages.map(message => <article className={`contact-message-card ${message.status === 'new' ? 'is-new' : ''}`} key={message._id}>
      <div className="contact-message-header"><div><div className="contact-message-sender"><h2>{message.name}</h2><span className={`contact-message-status ${message.status}`}>{message.status === 'new' ? 'New' : 'Read'}</span></div><a href={`mailto:${message.email}`}>{message.email}</a></div><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time></div>
      <h3>{message.subject || 'General inquiry'}</h3><p className="contact-message-body">{message.message}</p>
      <div className="contact-message-actions"><a className="btn btn-ghost" href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || 'Your S4 message'}`)}`}>Reply by email <ArrowUpRight size={15} /></a>{message.status === 'new' && <button className="btn btn-primary" onClick={() => markRead(message._id)}>Mark as read</button>}</div>
    </article>)}</div> : !error && <div className="empty-state"><Mail size={28} /><h3>No messages yet</h3><p>Messages submitted through the contact page will appear here.</p></div>}
  </div></AdminLayout>
}
function AdminSettings() { const [form, setForm] = useState({ whatsappNumber: '', enabledPaymentMethods: [], defaultDeliveryCharge: 0, defaultAdvanceAmount: 0, merchantAccounts: {} }); const [message, setMessage] = useState(''); const [error, setError] = useState(''); useEffect(() => { api.get('/settings').then(r => setForm(r.data.data)).catch(e => setError(e.message)) }, []); const toggle = method => setForm({ ...form, enabledPaymentMethods: form.enabledPaymentMethods.includes(method) ? form.enabledPaymentMethods.filter(x => x !== method) : [...form.enabledPaymentMethods, method] }); const save = async e => { e.preventDefault(); try { await api.put('/settings', form); setMessage('Settings saved.') } catch (err) { setError(err.message) } }; return <AdminLayout><AdminHeader title="Business settings" /><form className="admin-panel form-stack" onSubmit={save}><Field label="Global WhatsApp number" value={form.whatsappNumber} onChange={value => setForm({ ...form, whatsappNumber: value })} /><Field label="Default delivery charge" type="number" value={form.defaultDeliveryCharge} onChange={value => setForm({ ...form, defaultDeliveryCharge: value })} /><Field label="Advance delivery amount" type="number" value={form.defaultAdvanceAmount} onChange={value => setForm({ ...form, defaultAdvanceAmount: value })} /><div><strong>Enabled payment methods</strong>{['bKash', 'Nagad', 'Rocket'].map(method => <label className="check-row" key={method}><input type="checkbox" checked={form.enabledPaymentMethods.includes(method)} onChange={() => toggle(method)} /> {method}<Field label={`${method} merchant number`} value={form.merchantAccounts?.[method] || ''} onChange={value => setForm({ ...form, merchantAccounts: { ...form.merchantAccounts, [method]: value } })} /></label>)}</div>{error && <p className="form-error">{error}</p>}{message && <p className="success-message">{message}</p>}<button className="btn btn-primary">Save settings</button></form></AdminLayout> }
function AdminList({ type }) { const isProduct = type === 'products'; const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const load = () => { setLoading(true); api.get(`/${type}?includeUnpublished=true&limit=100`).then(r => setItems(r.data.data)).finally(() => setLoading(false)) }; useEffect(load, [type]); const remove = async id => { if (!window.confirm('Delete this item? This cannot be undone.')) return; await api.delete(`/${type}/${id}`); load() }; return <AdminLayout><AdminHeader title={isProduct ? 'Products' : 'Travel packages'} action={<Link className="btn btn-primary" to={`/admin/${type}/new`}><Plus size={17} /> Add {isProduct ? 'product' : 'package'}</Link>} /><div className="admin-panel">{loading ? <Loading /> : items.length ? <div className="admin-table">{items.map(item => <div className="admin-row" key={item._id}><Image src={item.images?.[0]?.url} alt="" /><div><strong>{isProduct ? item.name : item.title}</strong><span>{isProduct ? item.category : item.provider}</span></div><span className={item.isPublished ? 'published' : 'unpublished'}>{item.isPublished ? 'Published' : 'Draft'}</span><span>{formatMoney(item[isProduct ? 'price' : 'price'])}</span><Link className="icon-btn" to={`/admin/${type}/${item._id}/edit`} aria-label="Edit"><Pencil size={16} /></Link><button className="icon-btn danger" onClick={() => remove(item._id)} aria-label="Delete"><Trash2 size={16} /></button></div>)}</div> : <div className="empty-state"><p>No items yet.</p></div>}</div></AdminLayout> }
function Field({ label, name, value, onChange, type = 'text', required, placeholder }) { return <label className="field"><span>{label}</span><input name={name} type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} /></label> }
function Textarea({ label, value, onChange, placeholder }) { return <label className="field"><span>{label}</span><textarea value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows="4" /></label> }
function AdminForm({ type, editId: providedEditId }) {
  const { editId: routeEditId } = useParams()
  const editId = providedEditId || routeEditId
  const isProduct = type === 'products'
  const [form, setForm] = useState(isProduct
    ? { name: '', description: '', category: categories[0], price: '', discountPrice: '', stock: '', isPublished: true, contact: { whatsapp: '', paymentMethods: [], paymentAccounts: { bKash: '', nagad: '', rocket: '' } } }
    : { title: '', description: '', provider: providers[0], packageType: 'Tour', price: '', duration: '', highlights: '', inclusions: '', exclusions: '', departureDate: '', isPublished: true, contact: { whatsapp: '', paymentMethods: [], paymentAccounts: { bKash: '', nagad: '', rocket: '' } } })
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(Boolean(editId))
  const navigate = useNavigate()

  useEffect(() => {
    if (!editId) return
    let active = true
    setLoading(true)
    setError('')
    api.get(`/${type}/admin/${editId}`)
      .then(response => {
        if (!active) return
        const data = response.data.data
        setForm({
          ...data,
          contact: { whatsapp: '', paymentMethods: [], paymentAccounts: { bKash: '', nagad: '', rocket: '' }, ...data.contact },
          highlights: data.highlights?.join('\n') || '',
          inclusions: data.inclusions?.join('\n') || '',
          exclusions: data.exclusions?.join('\n') || '',
        })
      })
      .catch(requestError => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [editId, type])

  const set = (key, value) => setForm(previous => ({ ...previous, [key]: value }))
  const setContact = (key, value) => setForm(previous => ({ ...previous, contact: { ...previous.contact, [key]: value } }))
  const submit = async event => {
    event.preventDefault()
    if (loading || (editId && error)) return
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (!isProduct) ['highlights', 'inclusions', 'exclusions'].forEach(key => {
        payload[key] = payload[key].split('\n').map(value => value.trim()).filter(Boolean)
      })
      const data = new FormData()
      Object.entries(payload).forEach(([key, value]) => data.append(key, key === 'contact' ? JSON.stringify(value) : typeof value === 'boolean' ? String(value) : value ?? ''))
      files.forEach(file => data.append('images', file))
      if (editId) await api.put(`/${type}/${editId}`, data)
      else await api.post(`/${type}`, data)
      navigate(`/admin/${type}`)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return <AdminLayout><AdminHeader title={`${editId ? 'Edit' : 'Add'} ${isProduct ? 'product' : 'package'}`} /><form className="admin-form" onSubmit={submit}><div className="admin-panel form-panel"><div className="form-grid">
    <Field label={isProduct ? 'Product name' : 'Package title'} value={form[isProduct ? 'name' : 'title']} onChange={value => set(isProduct ? 'name' : 'title', value)} required />
    <Field label="Price (BDT)" type="number" value={form.price} onChange={value => set('price', value)} required />
    {isProduct ? <><label className="field"><span>Category</span><select value={form.category} onChange={event => set('category', event.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><Field label="Discount price (optional)" type="number" value={form.discountPrice} onChange={value => set('discountPrice', value)} /><Field label="Stock quantity" type="number" value={form.stock} onChange={value => set('stock', value)} required /></> : <><label className="field"><span>Provider</span><select value={form.provider} onChange={event => set('provider', event.target.value)}>{providers.map(provider => <option key={provider}>{provider}</option>)}</select></label><Field label="Package type" value={form.packageType} onChange={value => set('packageType', value)} /><Field label="Duration" value={form.duration} onChange={value => set('duration', value)} placeholder="e.g. 7 days / 6 nights" /><Field label="Departure date" type="date" value={form.departureDate?.slice(0, 10)} onChange={value => set('departureDate', value)} /></>}
    <Textarea label="Description" value={form.description} onChange={value => set('description', value)} />
    <Field label="Post WhatsApp number (optional override)" value={form.contact.whatsapp} onChange={value => setContact('whatsapp', value)} />
    <label className="field"><span>Enabled payment methods</span><select multiple value={form.contact.paymentMethods} onChange={event => setContact('paymentMethods', [...event.target.selectedOptions].map(option => option.value))}><option>bKash</option><option>Nagad</option><option>Rocket</option></select></label>
    {form.contact.paymentMethods.map(method => <Field key={method} label={`${method} number`} value={form.contact.paymentAccounts[method] || ''} onChange={value => setContact('paymentAccounts', { ...form.contact.paymentAccounts, [method]: value })} />)}
    {!isProduct && <><Textarea label="Highlights (one per line)" value={form.highlights} onChange={value => set('highlights', value)} /><Textarea label="Inclusions (one per line)" value={form.inclusions} onChange={value => set('inclusions', value)} /><Textarea label="Exclusions (one per line)" value={form.exclusions} onChange={value => set('exclusions', value)} /></>}
    <label className="upload-zone"><Upload size={20} /><span>{files.length ? `${files.length} image(s) selected` : 'Upload images (JPG, PNG, WebP)'}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => setFiles([...event.target.files])} /></label>
    <label className="checkbox"><input type="checkbox" checked={form.isPublished} onChange={event => set('isPublished', event.target.checked)} /><span>Publish immediately</span></label>
    {loading && <p role="status">Loading item details...</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><Link className="btn btn-ghost" to={`/admin/${type}`}>Cancel</Link><button className="btn btn-primary" disabled={saving || loading || Boolean(editId && error)}>{saving ? <Loader2 className="spin" size={17} /> : <Check size={17} />} {saving ? 'Saving...' : 'Save'}</button></div>
  </div></div></form></AdminLayout>
}
function EmployeeForm() { const [form, setForm] = useState({ name: '', email: '', password: '', whatsapp: '', bKash: '', nagad: '', rocket: '' }); const [message, setMessage] = useState(''); const set = (key, value) => setForm(prev => ({ ...prev, [key]: value })); const submit = async e => { e.preventDefault(); setMessage(''); try { await api.post('/admin/employees', { name: form.name, email: form.email, password: form.password, contacts: { whatsapp: form.whatsapp, bKash: form.bKash, nagad: form.nagad, rocket: form.rocket } }); setMessage('Employee account created.'); setForm({ name: '', email: '', password: '', whatsapp: '', bKash: '', nagad: '', rocket: '' }) } catch (error) { setMessage(error.message) } }; return <AdminLayout><AdminHeader title="Employees" /><div className="admin-panel"><span className="eyebrow">Create account</span><h2>New employee</h2><form className="form-grid employee-form" onSubmit={submit}><Field label="Name" value={form.name} onChange={v => set('name', v)} required /><Field label="Email" type="email" value={form.email} onChange={v => set('email', v)} required /><Field label="Temporary password" type="password" value={form.password} onChange={v => set('password', v)} required /><Field label="WhatsApp number" value={form.whatsapp} onChange={v => set('whatsapp', v)} /><Field label="bKash number" value={form.bKash} onChange={v => set('bKash', v)} /><Field label="Nagad number" value={form.nagad} onChange={v => set('nagad', v)} /><Field label="Rocket number" value={form.rocket} onChange={v => set('rocket', v)} /><div className="form-actions"><button className="btn btn-primary">Create employee <Check size={16} /></button></div></form>{message && <p className={message.includes('created') ? 'success-message' : 'form-error'}>{message}</p>}</div></AdminLayout> }
function RequestReview() { const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const load = useCallback(async () => { setLoading(true); try { const response = await api.get('/requests'); setItems(response.data.data || []); setError('') } catch (err) { setError(err.message) } finally { setLoading(false) } }, []); useEffect(() => { load() }, [load]); const decide = async (id, decision) => { const decisionNote = window.prompt('Optional decision note', '') || ''; try { await api.patch(`/requests/${id}/decision`, { decision, decisionNote }); await load() } catch (err) { setError(err.message) } }; return <AdminLayout><AdminHeader title="Review requests" /><div className="admin-panel">{error && <div className="empty-state"><h3>Unable to load requests</h3><p>{error}</p><button className="btn btn-primary" onClick={load}>Try again</button></div>}{loading ? <Loading /> : !error && (items.length ? items.map(item => <div className="sale-row request-row" key={item._id}><div><strong>{item.action} request · {item.postType}</strong><span>{item.employeeId?.name || 'Employee'} · {item.status} · {new Date(item.createdAt).toLocaleString()}</span><small>{item.reason || 'Proposed content changes submitted for review.'}</small></div>{item.status === 'pending' && <div className="form-actions"><button className="btn btn-primary" onClick={() => decide(item._id, 'approved')}>Approve</button><button className="btn btn-ghost" onClick={() => decide(item._id, 'rejected')}>Reject</button></div>}</div>) : <div className="empty-state"><p>No requests to review.</p></div>)}</div></AdminLayout> }
function EmployeeManagement() { const [employees, setEmployees] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const load = useCallback(async () => { setLoading(true); try { const response = await api.get('/admin/employees'); setEmployees(response.data.data || []); setError('') } catch (err) { setError(err.message) } finally { setLoading(false) } }, []); useEffect(() => { load() }, [load]); const toggle = async employee => { try { await api.put(`/admin/employees/${employee._id}`, { isActive: !employee.isActive }); await load() } catch (err) { setError(err.message) } }; return <AdminLayout><AdminHeader title="Employees" action={<Link className="btn btn-primary" to="/admin/employees/new"><Plus size={17} /> Add employee</Link>} /><div className="admin-panel employee-list-panel"><div className="panel-heading"><div><span className="eyebrow">Accounts</span><h2>Team members</h2></div></div>{error && <div className="empty-state"><h3>Unable to load employees</h3><p>{error}</p><button className="btn btn-primary" onClick={load}>Try again</button></div>}{loading ? <Loading /> : !error && (employees.length ? employees.map(employee => <div className="admin-row" key={employee._id}><div><strong>{employee.name}</strong><span>{employee.email}</span></div><span>{employee.contacts?.whatsapp || 'No WhatsApp'}</span><button className="btn btn-ghost" onClick={() => toggle(employee)}>{employee.isActive ? 'Deactivate' : 'Activate'}</button></div>) : <div className="empty-state"><p>No employee accounts yet.</p></div>)}</div></AdminLayout> }
function EmployeeLogin() { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate(); const submit = async e => { e.preventDefault(); try { await api.post('/auth/employee/login', { email, password }); navigate('/employee/dashboard') } catch (err) { setError(err.message) } }; return <div className="admin-login"><div className="login-card"><Logo /><span className="eyebrow">Employee workspace</span><h1>Sign in.</h1><form onSubmit={submit} className="form-stack"><Field label="Email" type="email" value={email} onChange={setEmail} required /><Field label="Password" type="password" value={password} onChange={setPassword} required />{error && <p className="form-error">{error}</p>}<button className="btn btn-primary">Continue <ArrowRight size={17} /></button></form><Link className="back-link" to="/">← Back to website</Link></div></div> }
function EmployeeDashboard() { const [data, setData] = useState(null); const navigate = useNavigate(); const load = useCallback(async () => { try { const [me, products, packages, requests] = await Promise.all([api.get('/auth/me'), api.get('/products?includeUnpublished=true&limit=100'), api.get('/packages?includeUnpublished=true&limit=100'), api.get('/requests')]); setData({ me: me.data.data, posts: [...products.data.data.map(x => ({ ...x, postType: 'products', title: x.name })), ...packages.data.data.map(x => ({ ...x, postType: 'packages' }))], requests: requests.data.data }) } catch { navigate('/employee/login') } }, [navigate]); useEffect(() => { load() }, [load]); if (!data) return <Loading />; const request = async (post, action) => { const reason = window.prompt(action === 'delete' ? 'Why should this post be deleted?' : 'Enter proposed changes as JSON'); if (!reason) return; let proposedChanges; if (action === 'edit') { try { proposedChanges = JSON.parse(reason) } catch { return window.alert('Changes must be valid JSON') } } await api.post('/requests', { postType: post.postType, postId: post._id, action, reason: action === 'delete' ? reason : undefined, proposedChanges }); load() }; return <div className="admin-shell"><aside className="admin-sidebar"><Logo /><nav><NavLink to="/employee/dashboard">My posts</NavLink><NavLink to="/">Public site</NavLink></nav><button className="logout-btn" onClick={async () => { await api.post('/auth/logout'); navigate('/employee/login') }}><LogOut size={16} /> Sign out</button></aside><main className="admin-main"><AdminHeader title={`Hello, ${data.me.name || 'there'}.`} /><div className="admin-panel"><span className="eyebrow">Your posts</span>{data.posts.length ? data.posts.map(post => <div className="admin-row" key={post._id}><div><strong>{post.title}</strong><span>{post.postType} · {post.isPublished ? 'Published' : 'Draft'}</span></div><button className="btn btn-ghost" onClick={() => request(post, 'edit')}>Request edit</button><button className="icon-btn danger" onClick={() => request(post, 'delete')}><Trash2 size={16} /></button></div>) : <div className="empty-state"><p>No posts assigned yet.</p></div>}</div></main></div> }
function App() { return <CartProvider><BrowserRouter><ApiLoadingOverlay /><Routes><Route path="/" element={<Home />} /><Route path="/products" element={<Products />} /><Route path="/products/:slug" element={<Detail type="products" />} /><Route path="/packages" element={<Packages />} /><Route path="/packages/:slug" element={<Detail type="packages" />} /><Route path="/cart" element={<CartPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/admin/login" element={<AdminLogin />} /><Route path="/admin/dashboard" element={<Dashboard />} /><Route path="/admin/orders" element={<AdminOrders />} /><Route path="/admin/contact-messages" element={<ContactMessages />} /><Route path="/admin/settings" element={<AdminSettings />} /><Route path="/admin/products" element={<AdminList type="products" />} /><Route path="/admin/products/new" element={<AdminForm type="products" />} /><Route path="/admin/products/:editId/edit" element={<AdminForm type="products" />} /><Route path="/admin/packages" element={<AdminList type="packages" />} /><Route path="/admin/packages/new" element={<AdminForm type="packages" />} /><Route path="/admin/packages/:editId/edit" element={<AdminForm type="packages" />} /><Route path="/admin/employees" element={<EmployeeManagement />} /><Route path="/admin/employees/new" element={<EmployeeForm />} /><Route path="/admin/requests" element={<RequestReview />} /><Route path="/employee/login" element={<EmployeeLogin />} /><Route path="/employee/dashboard" element={<EmployeeDashboard />} /></Routes></BrowserRouter></CartProvider> }
export default App
