import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
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

  if (!isAdminEmail(user.email)) {
    redirect('/');
  }

  const [{ data: maps }, { data: logs }, { data: players, error: playersError }] =
    await Promise.all([
      supabase.from('bf2_maps').select('*').order('sort_order'),
      supabase
        .from('bf2_game_logs')
        .select('*, bf2_maps(name)')
        .order('played_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('bf2_players').select('*').order('score', { ascending: false }),
    ]);

  return (
    <AdminApp
      userEmail={user.email}
      maps={maps ?? []}
      logs={logs ?? []}
      players={players ?? []}
      playersMissing={Boolean(playersError)}
    />
  );
}
