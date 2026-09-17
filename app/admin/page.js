import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminApp from '@/components/AdminApp';

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: maps }, { data: logs }] = await Promise.all([
    supabase.from('bf2_maps').select('*').order('sort_order'),
    supabase
      .from('bf2_game_logs')
      .select('*, bf2_maps(name)')
      .order('played_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return (
    <AdminApp
      userEmail={user.email}
      maps={maps ?? []}
      logs={logs ?? []}
    />
  );
}
