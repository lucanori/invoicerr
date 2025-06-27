import { Navigate } from "react-router"
import { useAuth } from "@/contexts/auth"

export default function Home() {
    const { accessToken } = useAuth()
    if (!accessToken) {
        return <Navigate to="/login" />
    }

    return <Navigate to="/dashboard" />
}