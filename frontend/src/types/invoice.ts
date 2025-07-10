import type { Client } from "./client";
import type { Company } from "./company";
import type { Payment, PaymentSummary } from "./payment";

export enum InvoiceStatus {
    PAID = 'PAID',
    UNPAID = 'UNPAID',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    OVERDUE = 'OVERDUE',
    SENT = 'SENT'
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    order: number;
}

export interface Invoice {
    id: string;
    number: string;
    title?: string;
    quoteId?: string;
    clientId: string;
    companyId: string;
    client: Client
    company: Company
    items: InvoiceItem[];
    payments?: Payment[]; // Optional for when payments are not loaded
    paymentSummary?: PaymentSummary; // Optional payment summary
    status: InvoiceStatus;
    createdAt: string;
    updatedAt: string;
    dueDate: string;
    paidAt?: string;
    paymentMethod?: string;
    paymentDetails?: string;
    notes?: string;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    currency: string;
    isActive: boolean;
}

export interface CreateInvoiceDto {
    quoteId?: string;
    clientId: string;
    dueDate?: Date;
    notes?: string;
    paymentMethod?: string;
    paymentDetails?: string;
    currency?: string;
    items: {
        id?: string;
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}

export interface EditInvoiceDto extends CreateInvoiceDto {
    id: string;
}

export enum RecurrenceFrequency {
    WEEKLY = 'WEEKLY',
    BIWEEKLY = 'BIWEEKLY', 
    MONTHLY = 'MONTHLY',
    BIMONTHLY = 'BIMONTHLY',
    QUARTERLY = 'QUARTERLY',
    QUADMONTHLY = 'QUADMONTHLY',
    SEMIANNUALLY = 'SEMIANNUALLY',
    ANNUALLY = 'ANNUALLY'
}

export interface RecurringInvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    order: number;
}

export interface RecurringInvoice {
    id: string;
    clientId: string;
    client: Client;
    companyId: string;
    company: Company;
    items: RecurringInvoiceItem[];
    paymentMethod?: string;
    paymentDetails?: string;
    notes?: string;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    currency: string;
    frequency: RecurrenceFrequency;
    count?: number;
    until?: Date | string;
    autoSend?: boolean;
    nextInvoiceDate?: Date | string;
    lastInvoiceDate?: Date | string;
    createdAt: string;
    updatedAt: string;
}