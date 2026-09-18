import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileView from '@/components/ProfileView';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Player ${id} | BF2 Log` };
}

export default async function PlayerPage({ params }) {
  const { id } = await params;
  const isPid = /^\d+$/.test(id);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isPid && !isUuid) notFound();

  const supabase = await createClient();

  const { data: player } = await supabase
    .from('bf2_players')
    .select('*')
    .eq(isPid ? 'external_id' : 'id', id)
    .maybeSingle();

  if (!player) notFound();

  const [{ data: catalog, error: catalogError }, { data: earned }] = await Promise.all([
    supabase.from('bf2_awards').select('*').order('sort_order'),
    supabase.from('bf2_player_awards').select('*').eq('player_id', player.id),
  ]);

  return (
    <main className="page">
      <div className="page-actions">
        <Link className="nav-link" href="/players">
          &larr; All players
        </Link>
        <Link className="nav-link" href="/ranks">
          Rank guide
        </Link>
        <Link className="nav-link" href="/">
          Back to progression
        </Link>
      </div>
      <ProfileView
        player={player}
        catalog={catalog ?? []}
        earned={earned ?? []}
        awardsMissing={Boolean(catalogError)}
      />
    </main>
  );
}
