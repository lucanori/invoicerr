import { Banknote, Download, Edit, Eye, Mail, Plus, Receipt, Trash2, Check, X, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { useGetRaw, usePost } from "@/lib/utils"

import BetterPagination from "../../../../components/pagination"
import { Button } from "@/components/ui/button"
import type { Invoice } from "@/types"
import { InvoiceDeleteDialog } from "./invoice-delete"
import { InvoicePdfModal } from "./invoice-pdf-view"
import { InvoiceUpsert } from "./invoice-upsert"
import { InvoiceViewDialog } from "./invoice-view"
import { InvoicePaymentDialog } from "../../../../components/invoice-payment-dialog"
import { PaymentProgress } from "../../../../components/payment-progress"
import type React from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

interface InvoiceListProps {
    invoices: Invoice[]
    loading: boolean
    title: string
    description: string
    page?: number
    pageCount?: number
    setPage?: (page: number) => void
    mutate: () => void
    emptyState: React.ReactNode
    showCreateButton?: boolean
}

export interface InvoiceListHandle {
    handleAddClick: () => void
}

export const InvoiceList = forwardRef<InvoiceListHandle, InvoiceListProps>(
    (
        { invoices, loading, title, description, page, pageCount, setPage, mutate, emptyState, showCreateButton = false },
        ref,
    ) => {
        const { t } = useTranslation()
        const { trigger: triggerMarkAsPaid } = usePost(`/api/payments/invoice`)
        const { trigger: triggerSendInvoiceByEmail } = usePost(`/api/invoices/send`)

        const [createInvoiceDialog, setCreateInvoiceDialog] = useState<boolean>(false)
        const [editInvoiceDialog, setEditInvoiceDialog] = useState<Invoice | null>(null)
        const [viewInvoiceDialog, setViewInvoiceDialog] = useState<Invoice | null>(null)
        const [viewInvoicePdfDialog, setViewInvoicePdfDialog] = useState<Invoice | null>(null)
        const [deleteInvoiceDialog, setDeleteInvoiceDialog] = useState<Invoice | null>(null)
        const [paymentDialog, setPaymentDialog] = useState<Invoice | null>(null)
        const [confirmingPayment, setConfirmingPayment] = useState<string | null>(null)
        const [downloadTrigger, setDownloadTrigger] = useState<{
            invoice: Invoice
            format: string
            id: number
        } | null>(null)

        const { data: pdf } = useGetRaw<Response>(
            `/api/invoices/${downloadTrigger?.invoice?.id}/pdf?format=${downloadTrigger?.format}`,
        )

        useImperativeHandle(ref, () => ({
            handleAddClick() {
                setCreateInvoiceDialog(true)
            },
        }))

        useEffect(() => {
            if (downloadTrigger && pdf) {
                pdf.arrayBuffer().then((buffer) => {
                    const blob = new Blob([buffer], { type: "application/pdf" })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement("a")
                    link.href = url
                    link.download = `invoice-${downloadTrigger.invoice.number}-${downloadTrigger.format || "default"}.pdf`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                    setDownloadTrigger(null)
                })
            }
        }, [downloadTrigger, pdf])

        function handleEdit(invoice: Invoice) {
            setEditInvoiceDialog(invoice)
        }

        function handleView(invoice: Invoice) {
            setViewInvoiceDialog(invoice)
        }

        function handleViewPdf(invoice: Invoice) {
            setViewInvoicePdfDialog(invoice)
        }

        function handleDelete(invoice: Invoice) {
            setDeleteInvoiceDialog(invoice)
        }

        function handlePayments(invoice: Invoice) {
            setPaymentDialog(invoice)
        }

        function handleMarkAsPaidClick(invoiceId: string) {
            setConfirmingPayment(invoiceId)
        }

        function handleConfirmMarkAsPaid(invoiceId: string) {
            triggerMarkAsPaid(`${invoiceId}/mark-fully-paid`, {})
                .then(() => {
                    toast.success(t("invoices.list.messages.markAsPaidSuccess"))
                    mutate()
                    setConfirmingPayment(null)
                })
                .catch((error) => {
                    console.error("Error marking invoice as paid:", error)
                    toast.error(t("invoices.list.messages.markAsPaidError"))
                    setConfirmingPayment(null)
                })
        }

        function handleCancelMarkAsPaid() {
            setConfirmingPayment(null)
        }

        function handleDownloadPdf({ invoice, format }: { invoice: Invoice; format: string }) {
            setDownloadTrigger({ invoice, format, id: Date.now() })
        }

        const getStatusColor = (status: string) => {
            switch (status) {
                case "SENT":
                    return "bg-yellow-100 text-yellow-800"
                case "UNPAID":
                    return "bg-blue-100 text-blue-800"
                case "PARTIALLY_PAID":
                    return "bg-purple-100 text-purple-800"
                case "OVERDUE":
                    return "bg-red-100 text-red-800"
                case "PAID":
                    return "bg-green-100 text-green-800"
                default:
                    return "bg-gray-100 text-gray-800"
            }
        }

        const getStatusLabel = (status: string) => {
            return t(`invoices.list.status.${status.toLowerCase()}`)
        }

        const handleSendInvoiceByEmail = (invoiceId: string) => {
            triggerSendInvoiceByEmail({ id: invoiceId })
                .then(() => {
                    toast.success(t("invoices.list.messages.sendByEmailSuccess"))
                })
                .catch((error) => {
                    console.error("Error sending invoice by email:", error)
                    toast.error(t("invoices.list.messages.sendByEmailError"))
                })
        }

        const needsPaymentActions = (invoice: Invoice) => {
            return invoice.status !== "PAID"
        }

        return (
            <>
                <Card className="gap-0">
                    <CardHeader className="border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <Receipt className="h-5 w-5 " />
                                <span>{title}</span>
                            </CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                        {showCreateButton && (
                            <Button onClick={() => setCreateInvoiceDialog(true)}>
                                <Plus className="h-4 w-4 mr-0 md:mr-2" />
                                <span className="hidden md:inline-flex">{t("invoices.list.actions.addNew")}</span>
                            </Button>
                        )}
                    </CardHeader>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                            </div>
                        ) : invoices.length === 0 ? (
                            emptyState
                        ) : (
                            <div className="divide-y">
                                {invoices.map((invoice, index) => (
                                    <div key={index} className="p-4 sm:p-6">
                                        <div className="flex flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex flex-row items-center gap-4 w-full">
                                                <div className="p-2 bg-blue-100 rounded-lg mb-4 md:mb-0 w-fit h-fit">
                                                    <Receipt className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-medium text-foreground break-words">
                                                            {t("invoices.list.item.title", {
                                                                number: invoice.number,
                                                                title: invoice.title,
                                                            })}
                                                        </h3>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}
                                                        >
                                                            {getStatusLabel(invoice.status)}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Payment Progress for partially paid invoices */}
                                                    {(invoice.status === 'PARTIALLY_PAID' || invoice.status === 'UNPAID') && (
                                                        <div className="max-w-md">
                                                            <PaymentProgress invoice={invoice} compact={true} />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                                                        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
                                                            <span>
                                                                <span className="font-medium text-foreground">{t("invoices.list.item.client")}:</span>{" "}
                                                                {invoice.client.name}
                                                            </span>
                                                            <span>
                                                                <span className="font-medium text-foreground">{t("invoices.list.item.issued")}:</span>{" "}
                                                                {new Date(invoice.createdAt).toLocaleDateString()}
                                                            </span>
                                                            <span>
                                                                <span className="font-medium text-foreground">{t("invoices.list.item.due")}:</span>{" "}
                                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                                            </span>
                                                            {invoice.paymentMethod && (
                                                                <span>
                                                                    <span className="font-medium text-foreground">
                                                                        {t("invoices.list.item.payment")}:
                                                                    </span>{" "}
                                                                    {invoice.paymentMethod}
                                                                </span>
                                                            )}
                                                            <span>
                                                                <span className="font-medium text-foreground">{t("invoices.list.item.totalHT")}:</span>{" "}
                                                                {invoice.totalHT.toFixed(2)} {invoice.currency}
                                                            </span>
                                                            <span>
                                                                <span className="font-medium text-foreground">{t("invoices.list.item.totalTTC")}:</span>{" "}
                                                                {invoice.totalTTC.toFixed(2)} {invoice.currency}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 lg:flex justify-start sm:justify-end gap-1 md:gap-2">
                                                <Button
                                                    tooltip={t("invoices.list.tooltips.view")}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleView(invoice)}
                                                    className="text-gray-600 hover:text-blue-600"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    tooltip={t("invoices.list.tooltips.viewPdf")}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleViewPdf(invoice)}
                                                    className="text-gray-600 hover:text-pink-600"
                                                >
                                                    <Receipt className="h-4 w-4" />
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            tooltip={t("invoices.list.tooltips.downloadPdf")}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-gray-600 hover:text-amber-600"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="center" className="[&>*]:cursor-pointer">
                                                        <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: "" })}>
                                                            {t("invoices.list.downloadFormats.pdf")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: "facturx" })}>
                                                            {t("invoices.list.downloadFormats.facturx")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: "zugferd" })}>
                                                            {t("invoices.list.downloadFormats.zugferd")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: "xrechnung" })}>
                                                            {t("invoices.list.downloadFormats.xrechnung")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: "ubl" })}>
                                                            {t("invoices.list.downloadFormats.ubl")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: "cii" })}>
                                                            {t("invoices.list.downloadFormats.cii")}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                {needsPaymentActions(invoice) && (
                                                    <Button
                                                        tooltip={t("invoices.list.tooltips.edit")}
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(invoice)}
                                                        className="text-gray-600 hover:text-green-600"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {needsPaymentActions(invoice) && (
                                                    <Button
                                                        tooltip={t("invoices.list.tooltips.sendByEmail")}
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => { handleSendInvoiceByEmail(invoice.id) }}
                                                        className="text-gray-600 hover:text-purple-600"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Partial Payments Button */}
                                                {needsPaymentActions(invoice) && (
                                                    <Button
                                                        tooltip={t("invoices.list.tooltips.managePayments")}
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handlePayments(invoice)}
                                                        className="text-gray-600 hover:text-indigo-600"
                                                    >
                                                        <CreditCard className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Mark as Paid - with confirmation */}
                                                {needsPaymentActions(invoice) && (
                                                    confirmingPayment === invoice.id ? (
                                                        <>
                                                            <Button
                                                                tooltip={t("invoices.list.tooltips.confirmMarkAsPaid")}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleConfirmMarkAsPaid(invoice.id)}
                                                                className="text-gray-600 hover:text-green-600"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                tooltip={t("invoices.list.tooltips.cancelMarkAsPaid")}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={handleCancelMarkAsPaid}
                                                                className="text-gray-600 hover:text-red-600"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            tooltip={t("invoices.list.tooltips.markAsPaid")}
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleMarkAsPaidClick(invoice.id)}
                                                            className="text-gray-600 hover:text-blue-600"
                                                        >
                                                            <Banknote className="h-4 w-4" />
                                                        </Button>
                                                    )
                                                )}

                                                {needsPaymentActions(invoice) && invoice.status !== "OVERDUE" && (
                                                    <Button
                                                        tooltip={t("invoices.list.tooltips.delete")}
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(invoice)}
                                                        className="text-gray-600 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    {page && pageCount && setPage && (
                        <CardFooter>
                            {!loading && invoices.length > 0 && (
                                <BetterPagination pageCount={pageCount} page={page} setPage={setPage} />
                            )}
                        </CardFooter>
                    )}
                </Card>

                <InvoiceUpsert
                    open={createInvoiceDialog}
                    onOpenChange={(open: boolean) => {
                        setCreateInvoiceDialog(open)
                        if (!open) mutate()
                    }}
                />

                <InvoiceUpsert
                    open={!!editInvoiceDialog}
                    invoice={editInvoiceDialog}
                    onOpenChange={(open: boolean) => {
                        if (!open) setEditInvoiceDialog(null)
                        mutate()
                    }}
                />

                <InvoiceViewDialog
                    invoice={viewInvoiceDialog}
                    onOpenChange={(open: boolean) => {
                        if (!open) setViewInvoiceDialog(null)
                    }}
                />

                <InvoicePdfModal
                    invoice={viewInvoicePdfDialog}
                    onOpenChange={(open: boolean) => {
                        if (!open) setViewInvoicePdfDialog(null)
                    }}
                />

                <InvoiceDeleteDialog
                    invoice={deleteInvoiceDialog}
                    onOpenChange={(open: boolean) => {
                        if (!open) setDeleteInvoiceDialog(null)
                        mutate()
                    }}
                />

                <InvoicePaymentDialog
                    invoice={paymentDialog}
                    onOpenChange={(open: boolean) => {
                        if (!open) setPaymentDialog(null)
                    }}
                    onUpdate={mutate}
                />
            </>
        )
    },
)
