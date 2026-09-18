'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/admin';

const SUPPORTS_FIELD = { 16: 'supports_16', 32: 'supports_32', 64: 'supports_64' };

export async function saveGameLog(formData) {
  const supabase = await requireAdminClient();

  const id = formData.get('id');
  const mapId = Number(formData.get('map_id'));
  const mapSize = Number(formData.get('map_size'));

  const { data: map, error: mapError } = await supabase
    .from('bf2_maps')
    .select('name, supports_16, supports_32, supports_64')
    .eq('id', mapId)
    .single();

  if (mapError) {
    throw new Error(mapError.message);
  }

  if (map[SUPPORTS_FIELD[mapSize]] === false) {
    throw new Error(`${map.name} does not have a size ${mapSize} version.`);
  }

  const payload = {
    map_id: mapId,
    player_count: Number(formData.get('player_count')),
    map_size: mapSize,
    bot_count: Number(formData.get('bot_count')),
    result: formData.get('result'),
    difficulty: formData.get('difficulty') ? Number(formData.get('difficulty')) : null,
    played_at: formData.get('played_at') || null,
    notes: formData.get('notes') || null,
  };

  const { error } = id
    ? await supabase.from('bf2_game_logs').update(payload).eq('id', id)
    : await supabase.from('bf2_game_logs').insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/history');
  revalidatePath('/admin');
}

export async function deleteGameLog(formData) {
  const supabase = await requireAdminClient();
  const id = formData.get('id');

  const { error } = await supabase.from('bf2_game_logs').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/history');
  revalidatePath('/admin');
}

export async function addMap(formData) {
  const supabase = await requireAdminClient();
  const name = formData.get('name');
  const sortOrder = Number(formData.get('sort_order'));

  const { error } = await supabase.from('bf2_maps').insert({
    name,
    sort_order: sortOrder,
    supports_16: formData.get('supports_16') === 'on',
    supports_32: formData.get('supports_32') === 'on',
    supports_64: formData.get('supports_64') === 'on',
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function updateMapSizes(formData) {
  const supabase = await requireAdminClient();
  const id = formData.get('id');

  const { error } = await supabase
    .from('bf2_maps')
    .update({
      supports_16: formData.get('supports_16') === 'on',
      supports_32: formData.get('supports_32') === 'on',
      supports_64: formData.get('supports_64') === 'on',
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteMap(formData) {
  const supabase = await requireAdminClient();
  const id = formData.get('id');

  const { error } = await supabase.from('bf2_maps').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function savePlayer(formData) {
  const supabase = await requireAdminClient();

  const id = formData.get('id');
  const name = String(formData.get('name') ?? '').trim();
  const overrideRaw = formData.get('rank_override');

  if (!name) {
    throw new Error('Player name is required.');
  }

  const payload = {
    name,
    score: Number(formData.get('score')),
    rank_override: overrideRaw === '' || overrideRaw == null ? null : Number(overrideRaw),
  };

  const { error } = id
    ? await supabase.from('bf2_players').update(payload).eq('id', id)
    : await supabase.from('bf2_players').insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deletePlayer(formData) {
  const supabase = await requireAdminClient();
  const id = formData.get('id');

  const { error } = await supabase.from('bf2_players').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
