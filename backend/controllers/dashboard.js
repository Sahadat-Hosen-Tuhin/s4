import Product from '../models/Product.js'
import TravelPackage from '../models/Package.js'
import Sale from '../models/Sale.js'
import Order from '../models/Order.js'
export async function dashboard(req, res) {
  const saleStatuses = ['paid', 'confirmed', 'completed']
  const [totalProducts, totalPackages, salesCount, salesRevenue, orderPayments, recentSales] = await Promise.all([
    Product.countDocuments(),
    TravelPackage.countDocuments(),
    Sale.countDocuments({ status: { $in: saleStatuses } }),
    Sale.aggregate([
      { $match: { status: { $in: saleStatuses } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Order.aggregate([
      { $match: { 'payment.status': { $in: ['partial', 'paid', 'verified'] } } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $gt: [{ $ifNull: ['$payment.paidAmount', 0] }, 0] },
                '$payment.paidAmount',
                { $cond: [{ $eq: ['$payment.status', 'verified'] }, '$pricing.total', 0] },
              ],
            },
          },
          count: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    {
                      $ifNull: [
                        '$payment.paidAmount',
                        { $cond: [{ $eq: ['$payment.status', 'verified'] }, '$pricing.total', 0] },
                      ],
                    },
                    0,
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    Sale.find().sort({ createdAt: -1 }).limit(5),
  ])
  res.json({
    data: {
      totalProducts,
      totalPackages,
      paidOrders: salesCount + (orderPayments[0]?.count || 0),
      revenue: (salesRevenue[0]?.total || 0) + (orderPayments[0]?.total || 0),
      recentSales,
    },
  })
}
export async function employeeDashboard(req, res) { const match = { employeeId: req.admin.id }; const [sales, revenue] = await Promise.all([Sale.find(match).sort({ createdAt: -1 }).limit(100), Sale.aggregate([{ $match: { ...match, status: { $in: ['paid', 'confirmed', 'completed'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }])]); res.json({ data: { sales, revenue: revenue[0]?.total || 0 } }) }
