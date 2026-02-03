'use client';

import { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { createPost } from '@/lib/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export function CreatePostModal({ isOpen, onClose, user, onSuccess }: CreatePostModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');

    try {
      await createPost({ text, user });
      setText('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white tracking-tight">CREATE NEW POST</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind? (Text only)"
              className="w-full h-40 bg-gray-950 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-2.5 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Send size={18} />
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
