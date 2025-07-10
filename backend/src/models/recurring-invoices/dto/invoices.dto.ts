export class UpsertInvoicesDto {
    quoteId?: string;
    clientId: string;
    notes?: string;
    paymentMethod?: string;
    paymentDetails?: string;
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'QUADMONTHLY' | 'SEMIANNUALLY' | 'ANNUALLY';
    count?: number;
    until?: Date;
    autoSend?: boolean;
    currency?: string;
    startDate?: Date; // When the recurring invoice should start generating
    items: {
        id?: string;
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}