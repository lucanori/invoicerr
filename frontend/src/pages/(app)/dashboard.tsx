import { Navigate } from "react-router"
import { useAuth } from "@/contexts/auth"

export default function Dashboard() {
    const { accessToken } = useAuth()
    if (!accessToken) {
        return <Navigate to="/login" />
    }

    /*
    Page content:

    - Quotes number (draft/sent/accepted/rejected)
    - Invoices number (draft/sent/paid/unpaid/overdue)
    - Revenue (total/last week/month/year) (line chart)
    */

    return (
        <div className="flex items-center justify-center h-full w-full">
            <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
    )
}