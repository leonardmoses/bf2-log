'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function saveGameLog(formData) {
  const supabase = await createClient();

  const id = formData.get('id');
  const payload = {
    map_id: Number(formData.get('map_id')),
    player_count: Number(formData.get('player_count')),
    map_size: Number(formData.get('map_size')),
    bot_count: Number(formData.get('bot_count')),
    result: formData.get('result'),
    difficulty: formData.get('difficulty') ? Number(formData.get('difficulty')) : null,
    played_at: formData.get('played_at'),
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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const name = formData.get('name');
  const sortOrder = Number(formData.get('sort_order'));

  const { error } = await supabase
    .from('bf2_maps')
    .insert({ name, sort_order: sortOrder });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteMap(formData) {
  const supabase = await createClient();
  const id = formData.get('id');

  const { error } = await supabase.from('bf2_maps').delete().eq('id', id);
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
