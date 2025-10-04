import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt-server';
import AdminPageClient from './components/AdminPageClient';

export default async function AdminPage() {
  // Checa JWT da cookie e exige categoria Admin
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) {
    redirect('/auth/login');
  }
  try {
    const payload = await verifyToken(token);
  if (payload.categoria.toLowerCase() !== 'admin') {
      redirect('/transmission');
    }
  } catch {
    redirect('/auth/login');
  }

  return <AdminPageClient />;
}
