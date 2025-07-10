import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';
import { LoginRequired } from 'src/decorators/login-required.decorator';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get('invoice/:invoiceId')
    @LoginRequired()
    async getPaymentsByInvoice(@Param('invoiceId') invoiceId: string) {
        return this.paymentsService.getPaymentsByInvoice(invoiceId);
    }

    @Get('invoice/:invoiceId/summary')
    @LoginRequired()
    async getInvoicePaymentSummary(@Param('invoiceId') invoiceId: string) {
        return this.paymentsService.getInvoicePaymentSummary(invoiceId);
    }

    @Post()
    @LoginRequired()
    async createPayment(@Body() body: CreatePaymentDto) {
        return this.paymentsService.createPayment(body);
    }

    @Patch(':id')
    @LoginRequired()
    async updatePayment(@Param('id') id: string, @Body() body: Omit<UpdatePaymentDto, 'id'>) {
        return this.paymentsService.updatePayment({ ...body, id });
    }

    @Delete(':id')
    @LoginRequired()
    async deletePayment(@Param('id') id: string) {
        return this.paymentsService.deletePayment(id);
    }

    @Post('invoice/:invoiceId/mark-fully-paid')
    @LoginRequired()
    async markInvoiceAsFullyPaid(@Param('invoiceId') invoiceId: string) {
        return this.paymentsService.markInvoiceAsFullyPaid(invoiceId);
    }
} 