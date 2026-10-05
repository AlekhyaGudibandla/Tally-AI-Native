'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions/auth';
import { KeyRound, Mail } from 'lucide-react';
import clsx from 'clsx';

export default function LoginForm() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <form action={dispatch} className="space-y-3">
      <div className="flex-1 rounded-lg bg-white px-6 pb-4 pt-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="mb-3 text-2xl text-slate-800 font-semibold">
          Please log in to continue.
        </h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-slate-900"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-slate-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-slate-500 text-slate-800"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
                defaultValue="admin@vahi.com"
              />
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 peer-focus:text-slate-900" />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-slate-900"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-slate-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-slate-500 text-slate-800"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                defaultValue="admin"
              />
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 peer-focus:text-slate-900" />
            </div>
          </div>
        </div>
        <LoginButton />
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
        <div className="mt-2 text-xs text-slate-500 text-center">
            Demo Login: admin@vahi.com / admin
        </div>
      </div>
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={clsx(
        "mt-6 flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
        {
          "opacity-50 cursor-not-allowed": pending,
        }
      )}
      aria-disabled={pending}
    >
      Log in
    </button>
  );
}
