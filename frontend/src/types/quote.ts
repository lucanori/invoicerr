import type { Client } from "./client";
import type { Company } from "./company";

export enum QuoteStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    VIEWED = "VIEWED",
    SIGNED = "SIGNED",
    EXPIRED = "EXPIRED",
}

export interface Quote {
    id: string;
    number: string;
    title?: string;
    clientId: string;
    client: Client;
    companyId: string;
    company: Company;
    items: QuoteItem[];
    status: QuoteStatus;
    createdAt: Date;
    updatedAt: Date;
    validUntil?: Date;
    signedAt?: Date;
    signatureSvg?: string;
    notes?: string;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    currency: string;
    paymentMethod?: string;
    paymentDetails?: string;
    isActive: boolean;
}

export interface QuoteItem {
    id: string;
    quoteId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    order: number;
}