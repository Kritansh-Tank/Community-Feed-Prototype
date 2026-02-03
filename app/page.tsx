'use client';

import { useEffect, useState } from 'react';
import { PostFeed } from '@/components/PostFeed';
import { Leaderboard } from '@/components/Leaderboard';
import { MessageSquare, Plus } from 'lucide-react';
import { CreatePostModal } from '@/components/CreatePostModal';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleCreatePostClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const handlePostSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30 w-full">
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic">COMMUNITY FEED</h1>
                <p className="text-gray-500 font-medium">Connect, discuss, and earn karma.</p>
              </div>
              <button 
                onClick={handleCreatePostClick}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20 flex items-center gap-2 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                CREATE POST
              </button>
            </div>
            
            <PostFeed refreshKey={refreshKey} user={user} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Leaderboard />
            
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20" />
              <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2 italic uppercase tracking-wider relative z-10">
                <MessageSquare size={16} />
                Pro Tip
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed relative z-10">
                Threaded discussions help keep conversations organized. Replying to a comment earns the author 1 Karma!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-xs font-medium uppercase tracking-[0.2em]">
            Built with speed & craftsmanship for Playto
          </p>
        </div>
      </footer>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user}
        onSuccess={handlePostSuccess}
      />
    </div>
  );
}
