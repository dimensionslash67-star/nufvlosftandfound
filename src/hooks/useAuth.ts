'use client';

import { useEffect, useState } from 'react';

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
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    let active = true;

    if (initialUser) {
      setUser(initialUser);
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

        if (!initialUser) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSession(!initialUser);

    return () => {
      active = false;
    };
  }, [initialUser]);

  return { user, loading };
}
