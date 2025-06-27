import { Navigate } from "react-router"
import { useAuth } from "@/contexts/auth"

export default function Quotes() {
    const { accessToken } = useAuth()
    if (!accessToken) {
        return <Navigate to="/login" />
    }

    /*
    Page content:

    - Quotes list (draft/sent/accepted/rejected)
    - Create new quote button
    - Quote details page (view/download/edit/delete)
    - Quote templates management
    - Quote settings (tax rates, currencies, etc.)
    */

    return (
        <div className="flex items-center justify-center h-full w-full">
            <h1 className="text-2xl font-bold">Quotes</h1>
        </div>
    )
}