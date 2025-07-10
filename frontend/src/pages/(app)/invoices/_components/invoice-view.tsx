import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CreditCard, Plus } from "lucide-react"
import { useState } from "react"

import type { Invoice, Payment, PaymentSummary } from "@/types"
import { InvoicePaymentDialog } from "../../../../components/invoice-payment-dialog"
import { PaymentProgress } from "../../../../components/payment-progress"
import { format } from "date-fns"
import { languageToLocale } from "@/lib/i18n"
import { useGet } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface InvoiceViewDialogProps {
    invoice: Invoice | null
    onOpenChange: (open: boolean) => void
}

export function InvoiceViewDialog({ invoice, onOpenChange }: InvoiceViewDialogProps) {
    const { t, i18n } = useTranslation()
    const [paymentDialog, setPaymentDialog] = useState<Invoice | null>(null)

    const { 
        data: payments, 
        mutate: mutatePayments 
    } = useGet<Payment[]>(invoice ? `/api/payments/invoice/${invoice.id}` : null)

    const { 
        data: paymentSummary, 
        mutate: mutateSummary 
    } = useGet<PaymentSummary>(invoice ? `/api/payments/invoice/${invoice.id}/summary` : null)

    if (!invoice) return null

    const formatDate = (date?: string) => (date ? format(new Date(date), "PPP", { locale: languageToLocale(i18n.language) }) : "—")

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: invoice?.currency || 'EUR',
        }).format(amount);
    }

    const getStatusLabel = (status: string) => {
        return t(`invoices.view.status.${status.toLowerCase()}`)
    }

    const handlePaymentUpdate = () => {
        mutatePayments()
        mutateSummary()
    }

    return (
        <>
            <Dialog open={!!invoice} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90dvh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-xl font-semibold">
                            {t("invoices.view.title", { number: invoice.number })}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">{t("invoices.view.description")}</DialogDescription>
                    </DialogHeader>

                    <div className="overflow-auto mt-2 flex-1 flex flex-col gap-4">
                        {/* Payment Summary Section */}
                        {invoice.status !== 'PAID' && paymentSummary && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">{t("payments.view.summary.title")}</CardTitle>
                                    <Button 
                                        size="sm"
                                        onClick={() => setPaymentDialog(invoice)}
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {t("payments.view.actions.managePayments")}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <PaymentProgress 
                                        invoice={invoice} 
                                        paymentSummary={paymentSummary} 
                                        compact={false} 
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Invoice Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.number")}</p>
                                <p className="font-medium">{invoice.number}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.title")}</p>
                                <p className="font-medium">{invoice.title || "—"}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.status")}</p>
                                <p className="font-medium">{getStatusLabel(invoice.status)}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.createdAt")}</p>
                                <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.dueDate")}</p>
                                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.paidAt")}</p>
                                <p className="font-medium">{formatDate(invoice.paidAt)}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.updatedAt")}</p>
                                <p className="font-medium">{formatDate(invoice.updatedAt)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.client")}</p>
                                <p className="font-medium">{invoice.client?.name || invoice.clientId}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.paymentMethod")}</p>
                                <p className="font-medium">{invoice.paymentMethod || "—"}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted/50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.totalHT")}</p>
                                <p className="font-medium">{invoice.totalHT.toFixed(2)} {invoice.currency}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.totalVAT")}</p>
                                <p className="font-medium">{invoice.totalVAT.toFixed(2)} {invoice.currency}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">{t("invoices.view.fields.totalTTC")}</p>
                                <p className="font-medium">{invoice.totalTTC.toFixed(2)} {invoice.currency}</p>
                            </div>
                        </div>

                        {/* Payment History */}
                        {payments && payments.length > 0 && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">{t("payments.view.history.title")}</CardTitle>
                                    <Button 
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPaymentDialog(invoice)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("payments.view.actions.addPayment")}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {payments.map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between p-3 border rounded-lg bg-card"
                                            >
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium text-lg">
                                                            {formatCurrency(payment.amount)}
                                                        </span>
                                                        {payment.method && (
                                                            <Badge variant="outline">{payment.method}</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(payment.date)}
                                                        </span>
                                                        {payment.notes && (
                                                            <span>{payment.notes}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {invoice.notes && (
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">{t("invoices.view.fields.notes")}</p>
                                <p className="font-medium">{invoice.notes}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <InvoicePaymentDialog
                invoice={paymentDialog}
                onOpenChange={(open: boolean) => {
                    if (!open) setPaymentDialog(null)
                }}
                onUpdate={handlePaymentUpdate}
            />
        </>
    )
}
