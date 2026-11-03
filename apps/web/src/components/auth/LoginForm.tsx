'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions/auth';
import { KeyRound, Mail, ArrowRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function LoginForm() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <form action={dispatch} className="space-y-4">
      <div>
        <label
          className="block text-xs font-semibold text-slate-700 mb-1.5"
          htmlFor="email"
        >
          Email address
        </label>
        <div className="relative">
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-2xs"
            id="email"
            type="email"
            name="email"
            placeholder="admin@ledgerai.com"
            required
            defaultValue="admin@ledgerai.com"
          />
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            className="block text-xs font-semibold text-slate-700"
            htmlFor="password"
          >
            Password
          </label>
        </div>
        <div className="relative">
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-2xs"
            id="password"
            type="password"
            name="password"
            placeholder="Enter your password"
            required
            defaultValue="admin"
          />
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <LoginButton />

      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="pt-2">
        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-600 flex items-center justify-between">
          <span className="font-medium text-slate-500">Demo Login:</span>
          <span className="font-semibold text-blue-700">admin@ledgerai.com / admin</span>
        </div>
      </div>
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "w-full mt-2 h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm transition hover:bg-blue-700",
        {
          "opacity-75 cursor-not-allowed": pending,
        }
      )}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <span>Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
