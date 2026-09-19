import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import HistoryTable from '@/components/HistoryTable';

export const revalidate = 0;

export default async function HistoryPage() {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('bf2_game_logs')
    .select('*, bf2_maps(name)')
    .order('played_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  const actions = (
    <div className="page-actions">
      <Link className="nav-link" href="/">
        &larr; Back to progression
      </Link>
    </div>
  );

  if (error) {
    return (
      <main className="page">
        {actions}
        <p className="error">Could not load history: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="page">
      {actions}
      <HistoryTable logs={logs ?? []} />
    </main>
  );
}
