import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './models/auth/auth.module';
import { ClientsModule } from './models/clients/clients.module';
import { CompanyModule } from './models/company/company.module';
import { DangerModule } from './models/danger/danger.module';
import { DashboardModule } from './models/dashboard/dashboard.module';
import { InvoicesModule } from './models/invoices/invoices.module';
import { Module } from '@nestjs/common';
import { PaymentsModule } from './models/payments/payments.module';
import { PrismaService } from './prisma/prisma.service';
import { QuotesModule } from './models/quotes/quotes.module';
import { SignaturesModule } from './models/signatures/signatures.module';
import { RecurringInvoicesModule } from './models/recurring-invoices/recurring-invoices.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    CompanyModule,
    ClientsModule,
    QuotesModule,
    InvoicesModule,
    PaymentsModule,
    DashboardModule,
    SignaturesModule,
    DangerModule,
    RecurringInvoicesModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
