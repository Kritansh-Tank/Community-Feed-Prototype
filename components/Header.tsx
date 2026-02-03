import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/login/actions'
import { LayoutDashboard, Users, LogOut } from 'lucide-react'

export default async function Header() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-gray-800 bg-black backdrop-blur-xl sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer no-underline">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white group-hover:rotate-12 transition-transform">
            P
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic text-white">Playto</span>
        </Link>

        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white transition-colors">
            <LayoutDashboard size={20} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Users size={20} />
          </button>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm hidden sm:inline">{user.email}</span>
              <form action={signOut}>
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-tighter">
                Login
              </Link>
              <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all text-xs uppercase tracking-tighter shadow-lg shadow-blue-500/20">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
