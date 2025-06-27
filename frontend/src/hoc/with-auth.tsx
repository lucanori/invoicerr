import { Navigate, useLocation } from 'react-router';

import Loading from '@/pages/_loading/loading';
import React from 'react';
import { useAuth } from '@/contexts/auth';

export function withAuth<P>(
    Component: React.ComponentType<P>
) {
    const Wrapped: React.FC<P & JSX.IntrinsicAttributes> = (props) => {
        const { user, loading } = useAuth();
        const loc = useLocation();
        if (loading) return <Loading />;
        if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
        return <Component {...props as P} />;
    };

    Wrapped.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
    return Wrapped;
}
