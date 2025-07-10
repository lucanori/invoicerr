import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
    constructor(private readonly prisma: PrismaService) { }

    async getPaymentsByInvoice(invoiceId: string) {
        return this.prisma.payment.findMany({
            where: { invoiceId },
            orderBy: { date: 'desc' },
        });
    }

    async createPayment(data: CreatePaymentDto) {
        const { invoiceId, amount, date, method, notes } = data;

        // Validate that the invoice exists
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true },
        });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        // Validate payment amount
        if (amount <= 0) {
            throw new BadRequestException('Payment amount must be positive');
        }

        const currentPaidAmount = this.calculateTotalPaid(invoice.payments);
        const newTotalPaid = currentPaidAmount + amount;

        if (newTotalPaid > invoice.totalTTC) {
            throw new BadRequestException('Payment amount exceeds remaining invoice balance');
        }

        // Create the payment
        const payment = await this.prisma.payment.create({
            data: {
                invoiceId,
                amount,
                date: date ? new Date(date) : new Date(),
                method,
                notes,
            },
        });

        // Update invoice status based on new payment
        await this.updateInvoiceStatus(invoiceId);

        return payment;
    }

    async updatePayment(data: UpdatePaymentDto) {
        const { id, amount, date, method, notes } = data;

        const existingPayment = await this.prisma.payment.findUnique({
            where: { id },
            include: { invoice: { include: { payments: true } } },
        });

        if (!existingPayment) {
            throw new BadRequestException('Payment not found');
        }

        // If amount is being updated, validate the new total
        if (amount !== undefined) {
            if (amount <= 0) {
                throw new BadRequestException('Payment amount must be positive');
            }

            const otherPayments = existingPayment.invoice.payments.filter(p => p.id !== id);
            const otherPaymentsTotal = this.calculateTotalPaid(otherPayments);
            const newTotalPaid = otherPaymentsTotal + amount;

            if (newTotalPaid > existingPayment.invoice.totalTTC) {
                throw new BadRequestException('Payment amount exceeds remaining invoice balance');
            }
        }

        // Update the payment
        const updatedPayment = await this.prisma.payment.update({
            where: { id },
            data: {
                ...(amount !== undefined && { amount }),
                ...(date !== undefined && { date: new Date(date) }),
                ...(method !== undefined && { method }),
                ...(notes !== undefined && { notes }),
            },
        });

        // Update invoice status
        await this.updateInvoiceStatus(existingPayment.invoiceId);

        return updatedPayment;
    }

    async deletePayment(id: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
        });

        if (!payment) {
            throw new BadRequestException('Payment not found');
        }

        await this.prisma.payment.delete({
            where: { id },
        });

        // Update invoice status after payment deletion
        await this.updateInvoiceStatus(payment.invoiceId);

        return { success: true };
    }

    async markInvoiceAsFullyPaid(invoiceId: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true },
        });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        const currentPaidAmount = this.calculateTotalPaid(invoice.payments);
        const remainingAmount = invoice.totalTTC - currentPaidAmount;

        if (remainingAmount <= 0) {
            throw new BadRequestException('Invoice is already fully paid');
        }

        // Create a payment for the remaining amount
        await this.prisma.payment.create({
            data: {
                invoiceId,
                amount: remainingAmount,
                date: new Date(),
                method: 'Manual Completion',
                notes: 'Marked as paid by user',
            },
        });

        // Update invoice status
        await this.updateInvoiceStatus(invoiceId);

        return { success: true, remainingAmount };
    }

    private calculateTotalPaid(payments: any[]): number {
        return payments.reduce((total, payment) => total + payment.amount, 0);
    }

    private async updateInvoiceStatus(invoiceId: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true },
        });

        if (!invoice) {
            return;
        }

        const totalPaid = this.calculateTotalPaid(invoice.payments);
        const totalAmount = invoice.totalTTC;

        let newStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE' | 'SENT';
        let paidAt: Date | null = null;

        if (totalPaid >= totalAmount) {
            newStatus = 'PAID';
            paidAt = new Date();
        } else if (totalPaid > 0) {
            newStatus = 'PARTIALLY_PAID';
        } else {
            // Check if invoice is overdue
            const today = new Date();
            if (invoice.dueDate < today) {
                newStatus = 'OVERDUE';
            } else {
                newStatus = invoice.status === 'SENT' ? 'SENT' : 'UNPAID';
            }
        }

        await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: newStatus,
                paidAt,
            },
        });
    }

    async getInvoicePaymentSummary(invoiceId: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true },
        });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        const totalPaid = this.calculateTotalPaid(invoice.payments);
        const remainingAmount = invoice.totalTTC - totalPaid;

        return {
            totalAmount: invoice.totalTTC,
            totalPaid,
            remainingAmount,
            paymentCount: invoice.payments.length,
            isFullyPaid: remainingAmount <= 0,
            paymentProgress: (totalPaid / invoice.totalTTC) * 100,
        };
    }
} 