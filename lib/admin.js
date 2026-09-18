import { createClient } from '@/lib/supabase/server';

// The ONLY accounts that can change stats. Keep in sync with the same list in
// supabase/013_admin_only_writes.sql (the database enforces it; this file drives the UI
// and server actions). Anyone else may sign up but is read-only.
export const ADMIN_EMAILS = ['qalexeon@gmail.com'];

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email ?? '').trim().toLowerCase());
}

// For server actions that write data: returns a Supabase client, or throws unless the
// signed-in user is an admin.
export async function requireAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new Error('Not authorized.');
  }
  return supabase;
}
