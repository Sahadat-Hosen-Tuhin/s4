import Product from '../models/Product.js'
import TravelPackage from '../models/Package.js'
import PostRequest from '../models/PostRequest.js'
import { deleteImage } from '../utils/cloudinary.js'

const modelFor = type => type === 'products' ? Product : type === 'packages' ? TravelPackage : null
export async function createRequest(req, res) {
  const { postType, postId, action, proposedChanges, reason } = req.body || {}
  if (!modelFor(postType) || !['edit', 'delete'].includes(action)) return res.status(400).json({ message: 'A valid post type and request action are required' })
  const post = await modelFor(postType).findById(postId)
  if (!post || String(post.createdBy) !== String(req.admin.id)) return res.status(404).json({ message: 'Post not found for this employee' })
  if (action === 'edit' && (!proposedChanges || typeof proposedChanges !== 'object')) return res.status(400).json({ message: 'Proposed changes are required for an edit request' })
  if (action === 'delete' && (!reason || String(reason).trim().length < 5)) return res.status(400).json({ message: 'A deletion reason is required' })
  const existing = await PostRequest.findOne({ postType, postId, employeeId: req.admin.id, status: 'pending' })
  if (existing) return res.status(409).json({ message: 'A request for this post is already pending' })
  const request = await PostRequest.create({ postType, postId, action, employeeId: req.admin.id, proposedChanges: action === 'edit' ? proposedChanges : null, reason })
  res.status(201).json({ data: request })
}
export async function listRequests(req, res) { const query = req.admin.role === 'admin' ? {} : { employeeId: req.admin.id }; const data = await PostRequest.find(query).populate('employeeId', 'name email').sort({ createdAt: -1 }); res.json({ data }) }
export async function decideRequest(req, res) {
  const request = await PostRequest.findById(req.params.id)
  if (!request || request.status !== 'pending') return res.status(404).json({ message: 'Pending request not found' })
  const { decision, decisionNote = '' } = req.body || {}
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ message: 'Decision must be approved or rejected' })
  const Model = modelFor(request.postType)
  const post = await Model.findById(request.postId)
  if (!post) return res.status(404).json({ message: 'Original post no longer exists' })
  if (decision === 'approved' && request.action === 'edit') { const allowed = ['name', 'title', 'description', 'category', 'provider', 'packageType', 'price', 'discountPrice', 'stock', 'duration', 'highlights', 'inclusions', 'exclusions', 'departureDate', 'isPublished', 'contact']; const changes = Object.fromEntries(Object.entries(request.proposedChanges || {}).filter(([key]) => allowed.includes(key))); Object.assign(post, changes); await post.save() }
  if (decision === 'approved' && request.action === 'delete') { await Model.findByIdAndDelete(post._id); await Promise.all(post.images.map(image => deleteImage(image.publicId))) }
  request.status = decision; request.decisionNote = String(decisionNote).trim(); request.decidedBy = req.admin.id; request.decidedAt = new Date(); await request.save(); res.json({ data: request })
}
