export class CreatePaymentDto {
    invoiceId: string;
    amount: number;
    date?: Date;
    method?: string;
    notes?: string;
}

export class UpdatePaymentDto {
    id: string;
    amount?: number;
    date?: Date;
    method?: string;
    notes?: string;
} 