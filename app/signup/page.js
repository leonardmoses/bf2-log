import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SignupForm from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <>
      <SiteHeader title="Admin" subtitle="Create the admin account. An invite code is required.">
        <Link className="button-link" href="/">
          &larr; Back to progression
        </Link>
      </SiteHeader>
      <main className="page page-narrow page-section">
        <div className="panel">
          <h2>Create admin account</h2>
          <SignupForm />
        </div>
      </main>
    </>
  );
}
