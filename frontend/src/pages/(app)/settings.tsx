import { Navigate } from "react-router"
import { useAuth } from "@/contexts/auth"

export default function Settings() {
    const { accessToken } = useAuth()
    if (!accessToken) {
        return <Navigate to="/login" />
    }

    /*
    Page content:

    - Company info (name, address, phone, email, logo, IBAN, VAT, etc.)
    - Signature settings (content, font, size) with preview for invoices/quotes
    - Email Template settings (for invoices/quotes)

    - Account settings (email, password, firstname, lastname)
    - Danger zone (delete account, delete everything, etc.)
    */


    return (
        <div className="flex items-center justify-center h-full w-full">
            <h1 className="text-2xl font-bold">Settings</h1>
        </div>
    )
}