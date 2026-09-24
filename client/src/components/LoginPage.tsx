import { CarFront } from 'lucide-react';
import { useState } from 'react';

export function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-stage flex min-h-screen items-center justify-center px-4 py-8">
      <div className="login-frame grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="login-story relative flex min-h-[280px] flex-col justify-between overflow-hidden p-8 text-white sm:p-12">
          <div className="relative z-10 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-400 p-3 text-slate-950"><CarFront className="h-6 w-6" /></div>
            <div><p className="text-[10px] uppercase tracking-[0.28em] text-amber-300">Cairo Auto Service</p><p className="font-semibold">Egypt Fleet Control</p></div>
          </div>
          <div className="relative z-10 mt-16">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">The workshop, in rhythm</p>
            <h1 className="max-w-md text-4xl font-bold leading-tight sm:text-5xl">Keep every car moving forward.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">A calm command center for intake, service, parts, payments, and the people who make it all happen.</p>
          </div>
          <div className="relative z-10 mt-12 flex flex-wrap gap-2 text-xs text-slate-300"><span className="rounded-full border border-white/20 px-3 py-1.5">Live workshop board</span><span className="rounded-full border border-white/20 px-3 py-1.5">12 branches</span></div>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">Staff entrance</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Welcome back.</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in and pick up where the shop left off.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                placeholder="name@domain.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                placeholder="••••••••"
              />
            </div>

            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="soft-button w-full rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
