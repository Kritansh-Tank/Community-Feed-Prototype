'use client';

import { useEffect, useState } from 'react';
import { getPosts } from '@/lib/api';
import { PostCard } from './PostCard';
import { Loader2 } from 'lucide-react';

export function PostFeed({ refreshKey, user }: { refreshKey?: number; user?: any }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await getPosts();
        setPosts(res.data);
      } catch (err) {
        console.error('Failed to fetch posts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">Loading Community Feed...</p>
      </div>
    );
  }

  const handleDelete = (id: number) => {
    setPosts((prev: any) => prev.filter((p: any) => p.id !== id));
  };

  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} user={user} onDelete={handleDelete} />
      ))}
      {posts.length === 0 && (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
          <p className="text-gray-500">The feed is empty. Start the conversation!</p>
        </div>
      )}
    </div>
  );
}
