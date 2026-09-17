import SignupForm from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <main className="page page-narrow">
      <h1>Create Admin Account</h1>
      <p className="subtitle">Requires an invite code.</p>
      <SignupForm />
    </main>
  );
}
