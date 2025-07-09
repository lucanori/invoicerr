import { Currency } from "@prisma/client";

export class CreateQuoteDto {
    title?: string;
    clientId: string;
    validUntil?: Date;
    currency?: Currency;
    paymentMethod?: string;
    paymentDetails?: string;
    notes: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}

export class EditQuotesDto {
    id: string;
    title?: string;
    clientId: string;
    validUntil?: Date;
    currency?: Currency;
    paymentMethod?: string;
    paymentDetails?: string;
    items: {
        id?: string;
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}