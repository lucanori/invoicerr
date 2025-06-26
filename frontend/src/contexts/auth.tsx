import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext<{
    accessToken: string | null;
    setAccessToken: (newToken: string) => void;

    refreshToken: string | null;
    setRefreshToken: (newToken: string) => void;
}>({
    accessToken: null,
    setAccessToken: () => { },
    refreshToken: null,
    setRefreshToken: () => { },
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [accessToken, setAccessToken_] = useState(localStorage.getItem("accessToken"));
    const [refreshToken, setRefreshToken_] = useState(localStorage.getItem("refreshToken"));

    const setAccessToken = (newToken: string) => {
        setAccessToken_(newToken);
    };

    const setRefreshToken = (newToken: string) => {
        setRefreshToken_(newToken);
    };

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

    const contextValue = useMemo(
        () => ({
            accessToken,
            refreshToken,
            setAccessToken,
            setRefreshToken,
        }),
        [accessToken, refreshToken, setAccessToken, setRefreshToken]
    );

    return (
        <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthProvider;