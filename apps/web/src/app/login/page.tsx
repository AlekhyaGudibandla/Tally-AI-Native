import LoginForm from '@/components/auth/LoginForm';
import { Layers } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50 relative p-4">
      <div className="w-full max-w-[440px] space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-2">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ledger AI
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to access your financial dashboard and automated accounting.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <LoginForm />
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Double-entry bookkeeping • Automated GST & Invoicing • AI Assistant
        </p>
      </div>
    </main>
  );
}
