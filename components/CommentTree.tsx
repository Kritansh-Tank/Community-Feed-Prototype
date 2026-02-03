'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { likeComment } from '@/lib/api';
import { MessageSquare, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { clsx, type ClassValue } from 'clsx';
const CommentForm = dynamic(() => import('./CommentForm'), { ssr: false });
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Comment {
  id: number;
  text: string;
  author: { username: string };
  created_at: string;
  like_count: number;
  replies: Comment[];
  is_liked: boolean;
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  user?: any;
  postId?: number;
  onRefresh?: () => void;
}

export function CommentTree({ comments, user, postId, onRefresh }: { comments: Comment[]; user?: any; postId?: number; onRefresh?: () => void }) {
  return (
    <div className="space-y-4 mt-6">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} user={user} postId={postId} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function CommentItem({ comment, depth = 0, user, postId, onRefresh }: CommentItemProps) {
  const [liked, setLiked] = useState(comment.is_liked);
  const [likes, setLikes] = useState(comment.like_count);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const router = useRouter();

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const res = await likeComment(comment.id, user);
      setLiked(res.data.liked);
      setLikes(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Failed to like comment', err);
    }
  };

  return (
    <div className={cn("relative", depth > 0 && "ml-4 pl-4 border-l border-gray-800")}>
      <div className="bg-gray-800/30 rounded-lg p-4 transition-colors hover:bg-gray-800/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-400 font-bold text-sm">@{comment.author.username}</span>
          <span className="text-gray-500 text-[10px] uppercase">
            {formatIST(comment.created_at)}
          </span>
        </div>
        <p className="text-gray-300 text-sm mb-4 leading-relaxed">{comment.text}</p>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105",
              liked ? "text-pink-500" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <Heart size={14} fill={liked ? "currentColor" : "none"} />
            {likes}
          </button>
          
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 font-bold"
          >
            <MessageSquare size={14} />
            Reply
          </button>
          {comment.replies.length > 0 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 font-bold"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}
            </button>
          )}
        </div>
      </div>

      {showReplyForm && (
        <div className="mt-2">
          <CommentForm postId={postId ?? 0} parent={comment.id} user={user} onSuccess={() => {
            setShowReplyForm(false);
            if (onRefresh) onRefresh();
          }} />
        </div>
      )}

      {isExpanded && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} user={user} postId={postId} onRefresh={onRefresh} />
          ))}
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
