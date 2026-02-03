"use client";

import { useState } from 'react';
import { createComment } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';

export default function CommentForm({ postId, parent, user, onSuccess }:
  { postId: number; parent?: number | null; user?: any; onSuccess?: () => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      await createComment({ text: text.trim(), post: postId, parent: parent ?? null, user });
      setText('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to create comment', err);
      alert('Failed to create comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm placeholder-gray-600 focus:outline-none"
        rows={3}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={14} />}
          Comment
        </button>
      </div>
    </form>
  );
}
