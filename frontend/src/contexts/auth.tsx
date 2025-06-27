import { createContext, useContext, useEffect, useMemo, useState } from "react";

import Loading from "@/pages/_loading/loading";
import { authenticatedFetch } from "@/lib/utils";

const AuthContext = createContext<{
    accessToken: string | null;
    refreshToken: string | null;
    user: any | null;
    loading: boolean;
    setAccessToken: (t: string | null) => void;
    setRefreshToken: (t: string | null) => void;
}>({
    accessToken: null,
    refreshToken: null,
    user: null,
    loading: true,
    setAccessToken: () => { },
    setRefreshToken: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [accessToken, setAccessToken_] = useState(localStorage.getItem("accessToken"));
    const [refreshToken, setRefreshToken_] = useState(localStorage.getItem("refreshToken"));
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const setAccessToken = (t: string | null) => setAccessToken_(t);
    const setRefreshToken = (t: string | null) => setRefreshToken_(t);

    useEffect(() => {
        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
        } else {
            localStorage.removeItem("accessToken");
        }
    }, [accessToken]);

    useEffect(() => {
        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        } else {
            localStorage.removeItem("refreshToken");
        }
    }, [refreshToken]);

    useEffect(() => {
        const defaultHeaders: Record<string, string> = {};
        if (accessToken) defaultHeaders["Authorization"] = `Bearer ${accessToken}`;

        async function fetchMe() {
            try {
                const res = await authenticatedFetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
                    method: "GET"
                }, true, null, setAccessToken);
                if (!res.ok) throw new Error("Non authentifié");
                const payload = await res.json();
                setUser(payload.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        fetchMe();
    }, [accessToken]);

    const value = useMemo(
        () => ({
            accessToken,
            refreshToken,
            user,
            loading,
            setAccessToken,
            setRefreshToken,
        }),
        [accessToken, refreshToken, user, loading]
    );

    return <AuthContext.Provider value={value}>{loading ? <Loading /> : children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);