import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class RecurringInvoicesCronService {
    private readonly logger = new Logger(RecurringInvoicesCronService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly invoicesService: InvoicesService,
    ) { }

    // Every day at 9:00 AM
    @Cron('0 9 * * *', {
        name: 'process-recurring-invoices',
        timeZone: 'Europe/Paris',
    })
    async processRecurringInvoices() {
        this.logger.log('Starting recurring invoices processing...');

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normaliser à minuit

            this.logger.log('Recurring invoices fetched from database:', await this.prisma.recurringInvoice.findMany());

            const recurringInvoices = await this.prisma.recurringInvoice.findMany({
                where: {
                    nextInvoiceDate: {
                        lte: today,
                    },
                    OR: [
                        { until: null },
                        { until: { gte: today } },
                    ],
                },
                include: {
                    client: true,
                    company: true,
                    items: true,
                },
            });

            this.logger.log(`Found ${recurringInvoices.length} recurring invoices to process`);

            for (const recurringInvoice of recurringInvoices) {
                try {
                    if (recurringInvoice.count) {
                        const generatedCount = await this.prisma.invoice.count({
                            where: {
                                recurringInvoiceId: recurringInvoice.id,
                            },
                        });

                        if (generatedCount >= recurringInvoice.count) {
                            this.logger.log(`Recurring invoice ${recurringInvoice.id} has reached its count limit`);
                            continue;
                        }
                    }

                    const invoice = await this.invoicesService.createInvoice({
                        clientId: recurringInvoice.clientId,
                        recurringInvoiceId: recurringInvoice.id,
                        currency: recurringInvoice.currency,
                        notes: recurringInvoice.notes || '',
                        paymentMethod: recurringInvoice.paymentMethod || undefined,
                        paymentDetails: recurringInvoice.paymentDetails || undefined,
                        items: recurringInvoice.items.map(item => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            vatRate: item.vatRate,
                            order: item.order,
                        })),
                    });

                    if (recurringInvoice.autoSend) {
                        try {
                            await this.invoicesService.sendInvoiceByEmail(invoice.id);
                        } catch (emailError) {
                            this.logger.error(`Failed to auto-send invoice ${invoice.id}:`, emailError);
                        }
                    }

                    const nextInvoiceDate = this.calculateNextInvoiceDate(
                        recurringInvoice.nextInvoiceDate || today,
                        recurringInvoice.frequency
                    );

                    await this.prisma.recurringInvoice.update({
                        where: { id: recurringInvoice.id },
                        data: {
                            nextInvoiceDate,
                            lastInvoiceDate: today,
                        },
                    });
                } catch (error) {
                    this.logger.error(`Error processing recurring invoice ${recurringInvoice.id}:`, error);
                }
            }

            this.logger.log('Recurring invoices processing completed');

        } catch (error) {
            this.logger.error('Error in recurring invoices cron job:', error);
        }
    }

    private calculateNextInvoiceDate(from: Date, frequency: string): Date {
        const nextDate = new Date(from);

        switch (frequency) {
            case 'WEEKLY':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'BIWEEKLY':
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case 'MONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'BIMONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 2);
                break;
            case 'QUARTERLY':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'QUADMONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 4);
                break;
            case 'SEMIANNUALLY':
                nextDate.setMonth(nextDate.getMonth() + 6);
                break;
            case 'ANNUALLY':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // Ensure the next date is in the future (no Monday constraint)
        while (nextDate <= from) {
            // If the calculated date is not in the future, add one more interval
            switch (frequency) {
                case 'WEEKLY':
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'BIWEEKLY':
                    nextDate.setDate(nextDate.getDate() + 14);
                    break;
                case 'MONTHLY':
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
                case 'BIMONTHLY':
                    nextDate.setMonth(nextDate.getMonth() + 2);
                    break;
                case 'QUARTERLY':
                    nextDate.setMonth(nextDate.getMonth() + 3);
                    break;
                case 'QUADMONTHLY':
                    nextDate.setMonth(nextDate.getMonth() + 4);
                    break;
                case 'SEMIANNUALLY':
                    nextDate.setMonth(nextDate.getMonth() + 6);
                    break;
                case 'ANNUALLY':
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    break;
                default:
                    nextDate.setMonth(nextDate.getMonth() + 1);
            }
        }

        return nextDate;
    }
}
