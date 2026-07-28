import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!user.isActive) {
    redirect('/login');
  }

  const role = String(user.role ?? '').trim().toUpperCase();

  if (role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return user;
}
