import { LoginForm } from "@/components/login-form"

export default function Home() {
  // In a real app, we would check if the user is already authenticated
  // and redirect them to the appropriate dashboard
  // For demo purposes, we'll just show the login form

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Signify</h1>
          <p className="mt-2 text-sm text-slate-600">Multi-tenant email signature management platform</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
