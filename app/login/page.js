import { Suspense } from 'react';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="page">
      <div className="page-actions">
        <Link className="nav-link" href="/">
          &larr; Back to progression
        </Link>
      </div>
      <div className="narrow">
        <div className="panel">
          <h2>Sign in</h2>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
