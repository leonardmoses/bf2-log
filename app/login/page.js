import { Suspense } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <>
      <SiteHeader title="Admin" subtitle="Sign in to log rounds and manage the roster.">
        <Link className="button-link" href="/">
          &larr; Back to progression
        </Link>
      </SiteHeader>
      <main className="page page-narrow page-section">
        <div className="panel">
          <h2>Sign in</h2>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}
