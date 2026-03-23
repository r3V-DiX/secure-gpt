"use client";
// packages/dashboard/src/contexts/auth-context.tsx

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import { api } from "@/lib/api/client";

export type UserRole = "super_admin" | "security_admin" | "auditor" | "user";

export interface AuthUser {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    is_active: boolean;
    org_id: string | null;
}

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const me = await api.get<AuthUser>("/auth/me");
            setUser(me);
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        refresh().finally(() => setLoading(false));
    }, [refresh]);

    const login = async (email: string, password: string) => {
        const res = await api.post<{ user: AuthUser }>("/auth/login", {
            email,
            password,
        });
        setUser(res.user);
    };

    const logout = async () => {
        await api.post("/auth/logout", {});
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

/** Returns true if the user has at least one of the given roles. */
export function useHasRole(...roles: UserRole[]) {
    const { user } = useAuth();
    if (!user) return false;
    return roles.includes(user.role);
}