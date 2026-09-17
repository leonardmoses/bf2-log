'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUpAdmin } from '@/app/signup/actions';

const initialState = { error: null, success: false };

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAdmin, initialState);

  if (state.success) {
    return (
      <p>
        Account created. You can now{' '}
        <Link href="/login">sign in</Link>.
      </p>
    );
  }

  return (
    <form className="form" action={formAction}>
      <label className="field">
        <span>Invite code</span>
        <input type="password" name="invite_code" required />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" name="email" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input type="password" name="password" minLength={6} required />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create admin account'}
      </button>
    </form>
  );
}
