import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import { useEffect } from "react"

import { BetterInput } from "@/components/better-input"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import type { Payment } from "@/types"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    dragHandle: React.ReactNode;
}

function SortableItem({ id, children, dragHandle }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div className="flex gap-2 items-center p-2 border rounded-md bg-card">
                <div {...listeners} className="cursor-grab hover:cursor-grabbing">
                    {dragHandle}
                </div>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface PartialPaymentFormProps {
    invoiceId: string;
    totalAmount: number;
    currency: string;
    existingPayments?: Payment[];
    onSubmit: (payments: PaymentFormData[]) => void;
    onCancel: () => void;
}

interface PaymentFormData {
    id?: string;
    amount: number;
    date: Date;
    method?: string;
    notes?: string;
    order: number;
}

export function PartialPaymentForm({ 
    invoiceId, 
    totalAmount, 
    currency, 
    existingPayments = [], 
    onSubmit, 
    onCancel 
}: PartialPaymentFormProps) {
    const { t } = useTranslation();

    const paymentSchema = z.object({
        payments: z.array(
            z.object({
                id: z.string().optional(),
                amount: z
                    .number({
                        invalid_type_error: t("payments.form.amount.errors.required"),
                    })
                    .min(0.01, t("payments.form.amount.errors.min"))
                    .refine((val) => !isNaN(val), {
                        message: t("payments.form.amount.errors.invalid"),
                    }),
                date: z.date({
                    required_error: t("payments.form.date.errors.required"),
                }),
                method: z.string().optional(),
                notes: z.string().optional(),
                order: z.number(),
            })
        ),
    });

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            payments: existingPayments.map((payment, index) => ({
                id: payment.id,
                amount: payment.amount,
                date: new Date(payment.date),
                method: payment.method || "",
                notes: payment.notes || "",
                order: index,
            })),
        },
    });

    const { control, handleSubmit, setValue, watch } = form;
    const { fields, append, move, remove } = useFieldArray({
        control,
        name: "payments",
    });

    const payments = watch("payments");
    const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const remainingAmount = Math.max(0, totalAmount - totalPayments);

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const onDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);
            move(oldIndex, newIndex);
            const reordered = arrayMove(fields, oldIndex, newIndex);
            reordered.forEach((_, index) => {
                setValue(`payments.${index}.order`, index);
            });
        }
    };

    useEffect(() => {
        fields.forEach((_, i) => {
            setValue(`payments.${i}.order`, i);
        });
    }, [fields, setValue]);

    const onRemove = (index: number) => {
        remove(index);
    };

    const onFormSubmit = (data: z.infer<typeof paymentSchema>) => {
        onSubmit(data.payments);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'EUR',
        }).format(amount);
    };

    return (
        <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                    <span>{t("payments.form.summary.totalAmount")}:</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>{t("payments.form.summary.totalPayments")}:</span>
                    <span className="font-medium">{formatCurrency(totalPayments)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                    <span>{t("payments.form.summary.remaining")}:</span>
                    <span className={`font-medium ${remainingAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(remainingAmount)}
                    </span>
                </div>
                {remainingAmount < 0 && (
                    <p className="text-sm text-red-600">{t("payments.form.summary.overpayment")}</p>
                )}
            </div>

            <Form {...form}>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div>
                        <FormLabel>{t("payments.form.payments.label")}</FormLabel>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {fields.map((fieldItem, index) => (
                                        <SortableItem
                                            key={fieldItem.id}
                                            id={fieldItem.id}
                                            dragHandle={<GripVertical className="h-4 w-4 text-muted-foreground" />}
                                        >
                                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                                                <FormField
                                                    control={control}
                                                    name={`payments.${index}.amount`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <BetterInput
                                                                    {...field}
                                                                    type="number"
                                                                    step="0.01"
                                                                    postAdornment={currency || 'EUR'}
                                                                    placeholder={t("payments.form.amount.placeholder")}
                                                                    onChange={(e) =>
                                                                        field.onChange(e.target.value === "" ? undefined : Number.parseFloat(e.target.value))
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={control}
                                                    name={`payments.${index}.date`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <DatePicker
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    placeholder={t("payments.form.date.placeholder")}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={control}
                                                    name={`payments.${index}.method`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder={t("payments.form.method.placeholder")}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="flex gap-2">
                                                    <FormField
                                                        control={control}
                                                        name={`payments.${index}.notes`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        placeholder={t("payments.form.notes.placeholder")}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button 
                                                        type="button"
                                                        variant="outline" 
                                                        size="icon"
                                                        onClick={() => onRemove(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-700" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </SortableItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <Button
                            type="button"
                            variant="outline"
                            className="mt-2"
                            onClick={() =>
                                append({
                                    amount: 0,
                                    date: new Date(),
                                    method: "",
                                    notes: "",
                                    order: fields.length,
                                })
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("payments.form.addPayment")}
                        </Button>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            {t("payments.form.actions.cancel")}
                        </Button>
                        <Button type="submit" disabled={remainingAmount < 0}>
                            {t("payments.form.actions.save")}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
} 