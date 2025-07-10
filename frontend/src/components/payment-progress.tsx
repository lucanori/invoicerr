import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Invoice, PaymentSummary } from "@/types";
import { useTranslation } from "react-i18next";

interface PaymentProgressProps {
    invoice: Invoice;
    paymentSummary?: PaymentSummary;
    compact?: boolean;
}

export function PaymentProgress({ invoice, paymentSummary, compact = false }: PaymentProgressProps) {
    const { t } = useTranslation();

    // If no payment summary provided, calculate basic info
    const summary = paymentSummary || {
        totalAmount: invoice.totalTTC,
        totalPaid: 0,
        remainingAmount: invoice.totalTTC,
        paymentCount: 0,
        isFullyPaid: invoice.status === 'PAID',
        paymentProgress: invoice.status === 'PAID' ? 100 : 0,
    };

    // Don't show progress for fully paid invoices unless compact mode
    if (summary.isFullyPaid && !compact) {
        return null;
    }

    const getStatusBadge = () => {
        switch (invoice.status) {
            case 'PAID':
                return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">{t("invoices.list.status.paid")}</Badge>;
            case 'PARTIALLY_PAID':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t("invoices.list.status.partiallyPaid")}</Badge>;
            case 'OVERDUE':
                return <Badge variant="destructive">{t("invoices.list.status.overdue")}</Badge>;
            case 'SENT':
                return <Badge variant="outline">{t("invoices.list.status.sent")}</Badge>;
            default:
                return <Badge variant="secondary">{t("invoices.list.status.unpaid")}</Badge>;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: invoice.currency || 'EUR',
        }).format(amount);
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {getStatusBadge()}
                {!summary.isFullyPaid && (
                    <div className="flex-1 min-w-20">
                        <Progress value={summary.paymentProgress} className="h-2" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                {getStatusBadge()}
                <span className="text-sm text-muted-foreground">
                    {formatCurrency(summary.totalPaid)} / {formatCurrency(summary.totalAmount)}
                </span>
            </div>
            
            {!summary.isFullyPaid && (
                <>
                    <Progress value={summary.paymentProgress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t("payments.progress.paid")}: {Math.round(summary.paymentProgress)}%</span>
                        <span>{t("payments.progress.remaining")}: {formatCurrency(summary.remainingAmount)}</span>
                    </div>
                </>
            )}
        </div>
    );
} 