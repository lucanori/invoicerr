export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    date: string;
    method?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentSummary {
    totalAmount: number;
    totalPaid: number;
    remainingAmount: number;
    paymentCount: number;
    isFullyPaid: boolean;
    paymentProgress: number; // percentage (0-100)
}

export interface CreatePaymentRequest {
    invoiceId: string;
    amount: number;
    date?: Date | string;
    method?: string;
    notes?: string;
}

export interface UpdatePaymentRequest {
    amount?: number;
    date?: Date | string;
    method?: string;
    notes?: string;
} 