import { Navigate } from "react-router"
import { useAuth } from "@/contexts/auth"

export default function Clients() {
    const { accessToken } = useAuth()
    if (!accessToken) {
        return <Navigate to="/login" />
    }

    return (
        <div className="flex items-center justify-center h-full w-full">
            <h1 className="text-2xl font-bold">Clients</h1>
        </div>
    )
}