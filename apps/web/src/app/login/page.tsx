import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-slate-900 p-3 md:h-36">
          <div className="w-32 text-white font-bold text-2xl tracking-tighter">
            Vahi<span className="text-indigo-400">.</span>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
