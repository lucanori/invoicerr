import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGet, usePost } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Plus, Trash2, Calendar, CreditCard } from "lucide-react";
import { PartialPaymentForm } from "./partial-payment-form";
import { PaymentProgress } from "./payment-progress";
import type { Invoice, Payment, PaymentSummary } from "@/types";

interface InvoicePaymentDialogProps {
    invoice: Invoice | null;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

interface PaymentFormData {
    id?: string;
    amount: number;
    date: Date;
    method?: string;
    notes?: string;
    order: number;
}

export function InvoicePaymentDialog({ invoice, onOpenChange, onUpdate }: InvoicePaymentDialogProps) {
    const { t } = useTranslation();
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [editingPayments, setEditingPayments] = useState<Payment[]>([]);

    const paymentsUrl = invoice ? `/api/payments/invoice/${invoice.id}` : "";
    const summaryUrl = invoice ? `/api/payments/invoice/${invoice.id}/summary` : "";

    const { 
        data: payments, 
        mutate: mutatePayments 
    } = useGet<Payment[]>(paymentsUrl);

    const { 
        data: paymentSummary, 
        mutate: mutateSummary 
    } = useGet<PaymentSummary>(summaryUrl);

    const { trigger: createPayment } = usePost("/api/payments");

    useEffect(() => {
        if (invoice && payments) {
            setEditingPayments([...payments]);
        }
    }, [invoice, payments]);

    const handleClose = () => {
        setShowPaymentForm(false);
        setEditingPayments([]);
        onOpenChange(false);
    };

    const handleSubmitPayments = async (paymentData: PaymentFormData[]) => {
        if (!invoice) return;

        try {
            // Process each payment
            for (const payment of paymentData) {
                if (payment.id) {
                    // Update existing payment using fetch directly
                    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/payments/${payment.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        },
                        body: JSON.stringify({
                            amount: payment.amount,
                            date: payment.date,
                            method: payment.method,
                            notes: payment.notes,
                        })
                    });
                    if (!res.ok) throw new Error('Failed to update payment');
                } else {
                    // Create new payment
                    await createPayment({
                        invoiceId: invoice.id,
                        amount: payment.amount,
                        date: payment.date,
                        method: payment.method,
                        notes: payment.notes,
                    });
                }
            }

            // Delete payments that were removed
            const existingIds = editingPayments.map(p => p.id);
            const submittedIds = paymentData.filter(p => p.id).map(p => p.id);
            const idsToDelete = existingIds.filter(id => !submittedIds.includes(id));

            for (const id of idsToDelete) {
                if (id) {
                    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/payments/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }
                    });
                    if (!res.ok) throw new Error('Failed to delete payment');
                }
            }

            // Refresh data
            await mutatePayments();
            await mutateSummary();
            onUpdate?.();
            
            setShowPaymentForm(false);
            toast.success(t("payments.messages.saveSuccess"));
        } catch (error) {
            console.error("Error saving payments:", error);
            toast.error(t("payments.messages.saveError"));
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/payments/${paymentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            if (!res.ok) throw new Error('Failed to delete payment');
            
            await mutatePayments();
            await mutateSummary();
            onUpdate?.();
            toast.success(t("payments.messages.deleteSuccess"));
        } catch (error) {
            console.error("Error deleting payment:", error);
            toast.error(t("payments.messages.deleteError"));
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: invoice?.currency || 'EUR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (!invoice) return null;

    return (
        <Dialog open={!!invoice} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {t("payments.dialog.title")} - {invoice.number}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Payment Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t("payments.dialog.summary.title")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {paymentSummary && (
                                <PaymentProgress 
                                    invoice={invoice} 
                                    paymentSummary={paymentSummary} 
                                    compact={false} 
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Form or Payment List */}
                    {showPaymentForm ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{t("payments.dialog.form.title")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PartialPaymentForm
                                    invoiceId={invoice.id}
                                    totalAmount={invoice.totalTTC}
                                    currency={invoice.currency}
                                    existingPayments={editingPayments}
                                    onSubmit={handleSubmitPayments}
                                    onCancel={() => setShowPaymentForm(false)}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">{t("payments.dialog.history.title")}</CardTitle>
                                <Button onClick={() => setShowPaymentForm(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t("payments.dialog.actions.addPayment")}
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {payments && payments.length > 0 ? (
                                    <div className="space-y-3">
                                        {payments.map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between p-4 border rounded-lg bg-card"
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
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingPayments([payment]);
                                                            setShowPaymentForm(true);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeletePayment(payment.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>{t("payments.dialog.history.empty")}</p>
                                        <p className="text-sm">{t("payments.dialog.history.emptyDescription")}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
} 