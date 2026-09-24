import { StatusCodes } from 'http-status-codes';
import { Invoice } from '../models/Invoice.model.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';
import { jobCardRepository } from '../repositories/jobCard.repository.js';
import type { InvoiceStatus, PaymentMethod } from '../types/enums.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginatedResult } from '../utils/pagination.js';

function paymentSum(invoice: { payments: Array<{ amount: number }> }) {
  return invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

function deriveStatus(grandTotal: number, amountPaid: number, current: InvoiceStatus): InvoiceStatus {
  if (amountPaid <= 0) {
    return current === 'DRAFT' ? 'DRAFT' : 'ISSUED';
  }
  if (amountPaid + 0.0001 >= grandTotal) {
    return 'PAID';
  }
  return 'PARTIALLY_PAID';
}

export const invoiceService = {
  async list(query: { page: number; limit: number; search?: string; status?: InvoiceStatus; jobCardId?: string }) {
    const { skip, page, limit } = paginate(query.page, query.limit);
    const [items, total] = await invoiceRepository.search({ ...query, skip, limit });
    return paginatedResult(items, total, page, limit);
  },

  async getById(id: string) {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found');
    }
    return invoice;
  },

  async createFromJob(jobCardId: string) {
    const job = await jobCardRepository.findByIdRaw(jobCardId);
    if (!job) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Job card not found');
    }

    const existing = await invoiceRepository.findByJobCard(jobCardId);
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'Invoice already exists for this job card');
    }

    const invoice = await Invoice.create({ jobCardId, status: 'DRAFT' });
    return invoiceRepository.findById(String(invoice._id));
  },

  async issue(id: string) {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found');
    }
    if (invoice.status !== 'DRAFT') {
      throw new ApiError(StatusCodes.CONFLICT, 'Only draft invoices can be issued');
    }

    const job = await jobCardRepository.findByIdRaw(String(invoice.jobCardId));
    if (!job) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Job card not found');
    }
    if (job.status !== 'READY_FOR_DELIVERY' && job.status !== 'COMPLETED') {
      throw new ApiError(StatusCodes.CONFLICT, 'Issue invoices only when the job is ready or completed');
    }

    invoice.status = 'ISSUED';
    await invoice.save();
    return this.getById(id);
  },

  async recordPayment(
    id: string,
    input: { amount: number; method: PaymentMethod; transactionRef?: string; date?: Date },
  ) {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Invoice not found');
    }
    if (invoice.status === 'DRAFT') {
      throw new ApiError(StatusCodes.CONFLICT, 'Issue the invoice before recording payment');
    }
    if (invoice.status === 'PAID') {
      throw new ApiError(StatusCodes.CONFLICT, 'Invoice is already paid');
    }

    const job = await jobCardRepository.findByIdRaw(String(invoice.jobCardId));
    if (!job) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Job card not found');
    }

    const paid = paymentSum(invoice);
    const remaining = Number((job.totals.grandTotal - paid).toFixed(2));
    if (input.amount - remaining > 0.009) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Payment exceeds remaining balance of ${remaining}`);
    }

    invoice.payments.push({
      amount: input.amount,
      method: input.method,
      transactionRef: input.transactionRef ?? '',
      date: input.date ?? new Date(),
    });

    invoice.status = deriveStatus(job.totals.grandTotal, paymentSum(invoice), invoice.status);
    await invoice.save();
    return this.getById(id);
  },
};
