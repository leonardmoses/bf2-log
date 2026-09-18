import Link from 'next/link';
import SignupForm from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <main className="page">
      <div className="page-actions">
        <Link className="nav-link" href="/">
          &larr; Back to progression
        </Link>
      </div>
      <div className="narrow">
        <div className="panel">
          <h2>Create admin account</h2>
          <p className="form-note">An invite code is required.</p>
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
