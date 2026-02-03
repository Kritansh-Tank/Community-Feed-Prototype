import Link from 'next/link'
import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams;
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto">
      <form
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        action={login}
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button className="bg-blue-600 rounded-md px-4 py-2 text-white font-semibold hover:bg-blue-700 transition-colors mb-2">
          Sign In
        </button>
        <div className="text-sm text-center">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </div>
        {params?.error && (
          <p className="mt-4 p-4 bg-red-100 text-red-700 text-center rounded-md">
            {params.error}
          </p>
        )}
        {params?.message && (
          <p className="mt-4 p-4 bg-green-100 text-green-700 text-center rounded-md">
            {params.message}
          </p>
        )}
      </form>
    </div>
  )
}
