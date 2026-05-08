'use client';

import { createContext, createElement, useContext, useEffect, useState } from 'react';

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const AuthSessionContext = createContext<SessionUser | null | undefined>(undefined);

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SessionUser>;
  return Boolean(
    candidate.id &&
      candidate.email &&
      candidate.username &&
      candidate.role &&
      typeof candidate.isActive === 'boolean' &&
      candidate.createdAt &&
      candidate.updatedAt,
  );
}

export function useAuth(initialUser: SessionUser | null = null) {
  const contextUser = useContext(AuthSessionContext);
  const resolvedInitialUser = initialUser ?? contextUser ?? null;
  const [user, setUser] = useState<SessionUser | null>(resolvedInitialUser);
  const [loading, setLoading] = useState(!resolvedInitialUser);

  useEffect(() => {
    let active = true;

    if (resolvedInitialUser) {
      setUser(resolvedInitialUser);
      setLoading(false);

      return () => {
        active = false;
      };
    }

    const loadSession = async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const res = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const data = await res.json().catch(() => ({ user: null }));

        if (!active) {
          return;
        }

        setUser(res.ok && isSessionUser(data.user) ? data.user : null);
      } catch {
        if (!active) {
          return;
        }

        if (!resolvedInitialUser) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSession(!resolvedInitialUser);

    return () => {
      active = false;
    };
  }, [resolvedInitialUser]);

  return { user, loading };
}

export function AuthSessionProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}) {
  return createElement(
    AuthSessionContext.Provider,
    { value: initialUser ?? null },
    children,
  );
}
