import { InventoryItem } from '../models/InventoryItem.model.js';
import { Invoice } from '../models/Invoice.model.js';
import { JobCard } from '../models/JobCard.model.js';
import { jobCardRepository } from '../repositories/jobCard.repository.js';

export const dashboardService = {
  async summary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [statusCounts, activeJobs, lowStockCount, todayPayments] = await Promise.all([
      jobCardRepository.countByStatus(),
      jobCardRepository.listActive(),
      InventoryItem.countDocuments({ $expr: { $lte: ['$stockQuantity', '$minThreshold'] } }),
      Invoice.aggregate<{ revenue: number }>([
        { $unwind: '$payments' },
        { $match: { 'payments.date': { $gte: startOfDay } } },
        { $group: { _id: null, revenue: { $sum: '$payments.amount' } } },
      ]),
    ]);

    const byStatus = Object.fromEntries(statusCounts.map((row) => [row._id, row.count]));
    const activeCars = await JobCard.countDocuments({
      status: { $nin: ['COMPLETED', 'CANCELLED'] },
    });

    return {
      activeCars,
      todayRevenue: todayPayments[0]?.revenue ?? 0,
      lowStockCount,
      jobsByStatus: byStatus,
      activeJobs,
    };
  },
};
