import { Navigate } from "react-router"
import { useAuth } from "@/contexts/auth"

export default function Invoices() {
    const { accessToken } = useAuth()
    if (!accessToken) {
        return <Navigate to="/login" />
    }

    /*
    Page content:

    - Invoices list (draft/sent/paid/unpaid/overdue)
    - Create new invoice button
    - Invoice details page (view/download/edit/delete)
    - Invoice templates management
    - Invoice settings (tax rates, currencies, etc.)
    */


    return (
        <div className="flex items-center justify-center h-full w-full">
            <h1 className="text-2xl font-bold">Invoices</h1>
        </div>
    )
}