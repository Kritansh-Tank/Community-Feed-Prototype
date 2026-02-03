'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { likePost, getPostComments } from '@/lib/api';
import { Heart, MessageSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
const CommentForm = dynamic(() => import('./CommentForm'), { ssr: false });
import { CommentTree } from './CommentTree';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Post {
  id: number;
  text: string;
  author: { username: string };
  created_at: string;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
}

export function PostCard({ post, user, onDelete }: { post: Post; user?: any; onDelete?: (id: number) => void }) {
  const [liked, setLiked] = useState(post.is_liked);
  const [likes, setLikes] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [loadingComments, setLoadingComments] = useState(false);
  const router = useRouter();

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const res = await likePost(post.id, user);
      setLiked(res.data.liked);
      setLikes(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const deriveUsername = (u: any) => {
    if (!u) return null;
    if (u.email) return u.email.split('@')[0];
    if (u.user && u.user.email) return u.user.email.split('@')[0];
    return u.username || null;
  };

  const canDelete = () => {
    const uname = deriveUsername(user);
    return uname && uname === post.author.username;
  };

  const handleDelete = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!canDelete()) {
      alert('Only the post author may delete this post.');
      return;
    }

    if (!confirm('Delete this post? This action cannot be undone.')) return;

    try {
      const { deletePost } = await import('@/lib/api');
      await deletePost(post.id, user);
      if (onDelete) onDelete(post.id);
    } catch (err) {
      console.error('Failed to delete post', err);
      alert('Failed to delete post');
    }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await getPostComments(post.id);
        setComments(res.data);
        setCommentCount(countTotalComments(res.data));
      } catch (err) {
        console.error('Failed to fetch comments', err);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg transition-all hover:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-inner">
              {post.author.username[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-100">@{post.author.username}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                {formatIST(post.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canDelete() && (
              <button
                onClick={handleDelete}
                title="Delete post"
                className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-md"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
        
        <p className="text-gray-300 text-lg mb-6 leading-relaxed">
          {post.text}
        </p>

        <div className="flex items-center gap-6 pt-4 border-t border-gray-800">
          <button 
            onClick={handleLike}
            className={cn(
              "flex items-center gap-2 text-sm font-bold transition-all hover:scale-110",
              liked ? "text-pink-500" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <Heart size={20} fill={liked ? "currentColor" : "none"} />
            {likes}
          </button>
          
          <button 
            onClick={toggleComments}
            className={cn(
              "flex items-center gap-2 text-sm font-bold transition-all hover:text-blue-400",
              showComments ? "text-blue-400" : "text-gray-500"
            )}
          >
            <MessageSquare size={20} />
            {commentCount}
            {showComments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {showComments && (
        <div className="bg-gray-950/50 border-t border-gray-800 p-6">
          <h4 className="text-xs font-black uppercase text-gray-500 mb-4 tracking-widest">Discussion</h4>
          {loadingComments ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-gray-800 rounded-lg w-full"></div>
              <div className="h-20 bg-gray-800 rounded-lg w-3/4 ml-auto"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                    <CommentForm
                      postId={post.id}
                      user={user}
                      onSuccess={async () => {
                        // refresh comments and update count
                        try {
                          const res = await getPostComments(post.id);
                          setComments(res.data);
                          setCommentCount(countTotalComments(res.data));
                        } catch (err) {
                          console.error('Failed to refresh comments', err);
                        }
                      }}
                    />
              </div>

              <CommentTree comments={comments} user={user} postId={post.id} onRefresh={async () => {
                try {
                  const res = await getPostComments(post.id);
                  setComments(res.data);
                } catch (err) {
                  console.error('Failed to refresh comments', err);
                }
              }} />
            </>
          )}
          {comments.length === 0 && !loadingComments && (
            <p className="text-gray-600 text-sm italic py-4 text-center">No comments yet. Be the first!</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatIST(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const date = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    const time = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
    return `${date} · ${time}`;
  } catch (e) {
    return new Date(dateStr).toLocaleString();
  }
}

function countTotalComments(comments: any[]): number {
  let count = 0;
  for (const c of comments) {
    count += 1;
    if (c.replies && c.replies.length) count += countTotalComments(c.replies);
  }
  return count;
}
