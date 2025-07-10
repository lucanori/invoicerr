import { $Enums, Company, Invoice, Quote } from '@prisma/client';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface DashboardData {
    company: Company | null,
    quotes: {
        total: number
        draft: number
        sent: number
        signed: number
        expired: number
        latests: Quote[]
    }
    invoices: {
        total: number
        unpaid: number
        sent: number
        paid: number
        partiallyPaid: number
        overdue: number
        latests: Invoice[]
    }
    clients: {
        total: number
    }
    revenue: {
        last6Months: { createdAt: Date, total: number }[]
        currentMonth: number
        previousMonth: number
        monthlyChange: number
        monthlyChangePercent: number
        last6Years: { createdAt: Date, total: number }[]
        currentYear: number
        previousYear: number
        yearlyChange: number
        yearlyChangePercent: number
    }
}

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardData(): Promise<DashboardData> {
        const quotes = await this.prisma.quote.groupBy({
            where: { isActive: true },
            by: ['status'],
            _count: true,
        });

        const invoices = await this.prisma.invoice.groupBy({
            where: { isActive: true },
            by: ['status'],
            _count: true,
        });
        const clientsCount = await this.prisma.client.count({
            where: { isActive: true },
        });
        const company = await this.prisma.company.findFirst();

        const latestQuotes = await this.prisma.quote.findMany({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
            include: { company: true, client: true },
            take: 5,
        });

        const latestInvoices = await this.prisma.invoice.findMany({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
            include: { company: true, client: true },
            take: 5,
        });

        const last6Months = await Promise.all(Array.from({ length: 6 }).map(async (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return {
                createdAt: new Date(date.getFullYear(), date.getMonth(), 1),
                total: await this.getMonthlyRevenue(date),
            };
        }));

        const currentMonthRevenue = await this.getMonthlyRevenue(new Date());

        const previousMonthDate = new Date();
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
        const previousMonthRevenue = await this.getMonthlyRevenue(previousMonthDate);

        const monthlyChange = currentMonthRevenue - previousMonthRevenue;

        const monthlyChangePercent = this.calculateChangePercent(currentMonthRevenue, previousMonthRevenue);

        const last6Years = await Promise.all(Array.from({ length: 6 }).map(async (_, i) => {
            const date = new Date();
            date.setFullYear(date.getFullYear() - i);
            return {
                createdAt: new Date(date.getFullYear(), 0, 1),
                total: await this.getYearlyRevenue(date),
            };
        }));

        const currentYearRevenue = await this.getYearlyRevenue(new Date());

        const previousYearDate = new Date();
        previousYearDate.setFullYear(previousYearDate.getFullYear() - 1);
        const previousYearRevenue = await this.getYearlyRevenue(previousYearDate);

        const yearlyChange = currentYearRevenue - previousYearRevenue;

        const yearlyChangePercent = this.calculateChangePercent(currentYearRevenue, previousYearRevenue);

        return {
            company,
            quotes: {
                total: quotes.reduce((acc, q) => acc + q._count, 0),
                draft: quotes.find(q => q.status === 'DRAFT')?._count || 0,
                sent: quotes.find(q => q.status === 'SENT')?._count || 0,
                signed: quotes.find(q => q.status === 'SIGNED')?._count || 0,
                expired: quotes.find(q => q.status === 'EXPIRED')?._count || 0,
                latests: latestQuotes,
            },
            invoices: {
                total: invoices.reduce((acc, i) => acc + i._count, 0),
                unpaid: invoices.find(i => i.status === 'UNPAID')?._count || 0,
                sent: invoices.find(i => i.status === 'SENT')?._count || 0,
                paid: invoices.find(i => i.status === 'PAID')?._count || 0,
                partiallyPaid: invoices.find(i => i.status === 'PARTIALLY_PAID')?._count || 0,
                overdue: invoices.find(i => i.status === 'OVERDUE')?._count || 0,
                latests: latestInvoices,
            },
            clients: {
                total: clientsCount,
            },
            revenue: {
                last6Months,
                currentMonth: currentMonthRevenue,
                previousMonth: previousMonthRevenue,
                monthlyChange,
                monthlyChangePercent,
                last6Years,
                currentYear: currentYearRevenue,
                previousYear: previousYearRevenue,
                yearlyChange,
                yearlyChangePercent,
            }
        };
    }


    async convertToMainCurrency(amount: number, fromCurrency: $Enums.Currency, toCurrency: $Enums.Currency): Promise<number> {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        const currencyRate = await this.prisma.currencyConversion.findFirst({
            where: {
                fromCurrency,
                toCurrency,
            }
        });

        if (currencyRate && (currencyRate.expiresAt > new Date())) {
            return amount * currencyRate.rate;
        }

        const res = await fetch(`https://hexarate.paikama.co/api/rates/latest/${fromCurrency}?target=${toCurrency}`)
        const data = await res.json();
        if (!data || data.status_code !== 200 || !data.data || !data.data.mid) {
            console.error(`Failed to fetch currency conversion data for ${fromCurrency} to ${toCurrency}`);
            return 0;
        }
        const rate = data.data.mid;

        await this.prisma.currencyConversion.upsert({
            where: {
                fromCurrency_toCurrency: {
                    fromCurrency,
                    toCurrency,
                }
            },
            create: {
                fromCurrency,
                toCurrency,
                rate,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
            update: {
                rate,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }
        });

        return amount * rate;
    }

    async getMonthlyRevenue(date: Date): Promise<number> {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Get all invoices for the month with their payments
        const invoices = await this.prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
                isActive: true,
            },
            include: { 
                company: true,
                payments: true
            }
        });

        let totalRevenue = 0;

        for (const invoice of invoices) {
            // Calculate total payments for this invoice
            const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
            
            // Convert to main currency and add to total
            const convertedAmount = await this.convertToMainCurrency(
                totalPaid, 
                invoice.currency, 
                invoice.company.currency
            );
            totalRevenue += convertedAmount;
        }

        return totalRevenue;
    }

    async getYearlyRevenue(date: Date): Promise<number> {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const endOfYear = new Date(date.getFullYear() + 1, 0, 0);

        // Get all invoices for the year with their payments
        const invoices = await this.prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: startOfYear,
                    lte: endOfYear,
                },
                isActive: true,
            },
            include: { 
                company: true,
                payments: true
            }
        });

        let totalRevenue = 0;

        for (const invoice of invoices) {
            // Calculate total payments for this invoice
            const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
            
            // Convert to main currency and add to total
            const convertedAmount = await this.convertToMainCurrency(
                totalPaid, 
                invoice.currency, 
                invoice.company.currency
            );
            totalRevenue += convertedAmount;
        }

        return totalRevenue;
    }

    calculateChangePercent(current: number, previous: number): number {
        if (current === previous) return 0;
        if (previous === 0) return current > 0 ? 100 : -100; // Handle division by zero
        return ((current - previous) / Math.abs(previous)) * 100;
    }
}
