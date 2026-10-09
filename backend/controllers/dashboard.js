import Product from '../models/Product.js'
import TravelPackage from '../models/Package.js'
import Sale from '../models/Sale.js'
export async function dashboard(req, res) { const [totalProducts, totalPackages, paidOrders, revenue, recentSales] = await Promise.all([Product.countDocuments(), TravelPackage.countDocuments(), Sale.countDocuments({ status: { $in: ['paid', 'completed'] } }), Sale.aggregate([{ $match: { status: { $in: ['paid', 'completed'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]), Sale.find().sort({ createdAt: -1 }).limit(5)]); res.json({ data: { totalProducts, totalPackages, paidOrders, revenue: revenue[0]?.total || 0, recentSales } }) }
