'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function signUpAdmin(prevState, formData) {
  const inviteCode = formData.get('invite_code');

  if (!process.env.ADMIN_SIGNUP_CODE) {
    return { error: 'Signup is not configured. Set ADMIN_SIGNUP_CODE.' };
  }

  if (inviteCode !== process.env.ADMIN_SIGNUP_CODE) {
    return { error: 'Invalid invite code.' };
  }

  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (String(password).length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
